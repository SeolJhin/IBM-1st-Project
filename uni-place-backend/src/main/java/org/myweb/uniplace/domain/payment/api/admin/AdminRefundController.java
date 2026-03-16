package org.myweb.uniplace.domain.payment.api.admin;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.billing.domain.entity.MonthlyCharge;
import org.myweb.uniplace.domain.billing.repository.MonthlyChargeRepository;
import org.myweb.uniplace.domain.commerce.domain.entity.Order;
import org.myweb.uniplace.domain.commerce.domain.entity.OrderItem;
import org.myweb.uniplace.domain.commerce.repository.OrderRepository;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.payment.api.dto.request.AdminOrderRefundRequest;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentRefundRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentRefundResponse;
import org.myweb.uniplace.domain.payment.application.gateway.PaymentGateway;
import org.myweb.uniplace.domain.payment.application.gateway.PaymentGatewayFactory;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayRefundRequest;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayRefundResponse;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentRefund;
import org.myweb.uniplace.domain.payment.repository.PaymentRefundRepository;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.myweb.uniplace.domain.commerce.application.ProductService;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/refunds")
@RequiredArgsConstructor
public class AdminRefundController {

    private static final Logger log = LoggerFactory.getLogger(AdminRefundController.class);
    private static final String TARGET_ORDER          = "order";
    private static final String TARGET_MONTHLY_CHARGE = "monthly_charge";

    private final PaymentRefundRepository       paymentRefundRepository;
    private final PaymentRepository             paymentRepository;
    private final PaymentGatewayFactory         paymentGatewayFactory;
    private final OrderRepository               orderRepository;
    private final MonthlyChargeRepository       monthlyChargeRepository;
    private final NotificationService           notificationService;
    private final ProductService                productService;

    // ── 환불 목록 조회 ──────────────────────────────────────────
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<PaymentRefund> findAll() {
        return paymentRefundRepository.findAll();
    }

    // ── 주문 상품 목록 조회 (환불 모달에서 상품 선택용) ──────────
    @GetMapping("/{paymentId}/order-items")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> getOrderItems(
            @PathVariable("paymentId") Integer paymentId
    ) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        if (!TARGET_ORDER.equals(payment.getTargetType()) || payment.getTargetId() == null) {
            return ApiResponse.ok(List.of());
        }

        Order order = orderRepository.findByIdWithItems(payment.getTargetId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        List<Map<String, Object>> items = order.getOrderItems().stream()
                .map(item -> Map.<String, Object>of(
                        "orderItemId",    item.getOrderItemId(),
                        "prodId",         item.getProduct().getProdId(),
                        "prodNm",         item.getProduct().getProdNm(),
                        "buildingId",     item.getBuildingId() != null ? item.getBuildingId() : "",
                        "orderQuantity",  item.getOrderQuantity(),
                        "orderPrice",     item.getOrderPrice()
                ))
                .collect(Collectors.toList());

        return ApiResponse.ok(items);
    }

    /**
     * 어드민 환불 (전체/일반 부분환불)
     * POST /admin/refunds/{paymentId}
     * Body: { "refundPrice": 10000, "refundReason": "관리자 환불" }
     * - refundPrice 생략 → 전체 환불
     */
    @PostMapping("/{paymentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ApiResponse<PaymentRefundResponse> adminRefund(
            @PathVariable("paymentId") Integer paymentId,
            @RequestBody(required = false) PaymentRefundRequest request
    ) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        if (!"paid".equalsIgnoreCase(payment.getPaymentSt())) {
            throw new BusinessException(ErrorCode.PAYMENT_REFUND_NOT_ALLOWED);
        }

        BigDecimal refundPrice = (request != null && request.getRefundPrice() != null)
                ? request.getRefundPrice()
                : (payment.getCapturedPrice() != null
                    ? payment.getCapturedPrice() : payment.getTotalPrice());

        String refundReason = (request != null && hasText(request.getRefundReason()))
                ? request.getRefundReason() : "관리자 환불 처리";

        validateRefundAmount(payment, refundPrice);

        PaymentRefund refund = saveRefundRecord(payment.getPaymentId(), refundPrice, refundReason);

        executePgRefund(payment, refundPrice, refundReason, refund);

        refund.markDone(LocalDateTime.now());
        paymentRefundRepository.save(refund);
        payment.markCanceled();
        paymentRepository.save(payment);

        // 월세 상태 동기화 (주문은 재고 복원 없이 cancel만)
        syncTargetCanceled(payment, false);
        notifyRefundDone(payment, refundPrice);

        log.info("[AdminRefund] 환불 완료 paymentId={} refundPrice={}", paymentId, refundPrice);

        return ApiResponse.ok(PaymentRefundResponse.builder()
                .paymentId(payment.getPaymentId())
                .refundId(refund.getRefundId())
                .paymentSt(payment.getPaymentSt())
                .build());
    }

    /**
     * 룸서비스 주문 상품별 환불
     * POST /admin/refunds/{paymentId}/order
     * Body: {
     *   "refundReason": "상품 불량",
     *   "restoreStock": true,
     *   "refundItems": [
     *     { "orderItemId": 1, "quantity": null },   // null = 전체 수량
     *     { "orderItemId": 2, "quantity": 1 }
     *   ]
     * }
     * - refundItems 생략/빈 리스트 → 전체 주문 환불
     */
    @PostMapping("/{paymentId}/order")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ApiResponse<PaymentRefundResponse> adminOrderRefund(
            @PathVariable("paymentId") Integer paymentId,
            @RequestBody AdminOrderRefundRequest request
    ) {
        if (!hasText(request.getRefundReason())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        if (!"paid".equalsIgnoreCase(payment.getPaymentSt())) {
            throw new BusinessException(ErrorCode.PAYMENT_REFUND_NOT_ALLOWED);
        }

        if (!TARGET_ORDER.equals(payment.getTargetType()) || payment.getTargetId() == null) {
            throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
        }

        Order order = orderRepository.findByIdWithItems(payment.getTargetId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        List<OrderItem> allItems = order.getOrderItems();

        // ── 환불 대상 항목 결정 ────────────────────────────────
        List<AdminOrderRefundRequest.RefundItem> targetItems = request.getRefundItems();
        boolean isFullRefund = (targetItems == null || targetItems.isEmpty());

        // 환불 금액 계산
        BigDecimal refundPrice;
        Map<Integer, Integer> refundQtyByItemId; // orderItemId → 환불수량

        if (isFullRefund) {
            // 전체 환불: capturedPrice 기준
            refundPrice = payment.getCapturedPrice() != null
                    ? payment.getCapturedPrice() : payment.getTotalPrice();
            refundQtyByItemId = allItems.stream()
                    .collect(Collectors.toMap(OrderItem::getOrderItemId, OrderItem::getOrderQuantity));
        } else {
            // 상품별 부분 환불: 선택한 항목 가격 합산
            Map<Integer, OrderItem> itemMap = allItems.stream()
                    .collect(Collectors.toMap(OrderItem::getOrderItemId, i -> i));

            refundPrice = BigDecimal.ZERO;
            refundQtyByItemId = new java.util.HashMap<>();

            for (AdminOrderRefundRequest.RefundItem ri : targetItems) {
                OrderItem item = itemMap.get(ri.getOrderItemId());
                if (item == null) continue;

                int qty = (ri.getQuantity() != null && ri.getQuantity() > 0)
                        ? Math.min(ri.getQuantity(), item.getOrderQuantity())
                        : item.getOrderQuantity();

                BigDecimal unitPrice = item.getOrderPrice()
                        .divide(BigDecimal.valueOf(item.getOrderQuantity()), 0, java.math.RoundingMode.DOWN);
                refundPrice = refundPrice.add(unitPrice.multiply(BigDecimal.valueOf(qty)));
                refundQtyByItemId.put(item.getOrderItemId(), qty);
            }

            if (refundPrice.signum() <= 0) {
                throw new BusinessException(ErrorCode.PAYMENT_REFUND_INVALID_AMOUNT);
            }
        }

        validateRefundAmount(payment, refundPrice);

        PaymentRefund refund = saveRefundRecord(payment.getPaymentId(), refundPrice, request.getRefundReason());

        executePgRefund(payment, refundPrice, request.getRefundReason(), refund);

        refund.markDone(LocalDateTime.now());
        paymentRefundRepository.save(refund);

        // ── 재고 복원 (선택한 경우만) ─────────────────────────
        if (request.isRestoreStock()) {
            for (OrderItem item : allItems) {
                Integer qty = refundQtyByItemId.get(item.getOrderItemId());
                if (qty == null || qty <= 0) continue;
                if (item.getBuildingId() != null) {
                    try {
                        productService.restoreBuildingStock(
                                item.getProduct().getProdId(),
                                item.getBuildingId(),
                                qty
                        );
                        log.info("[AdminRefund] 재고 복원 prodId={} buildingId={} qty={}",
                                item.getProduct().getProdId(), item.getBuildingId(), qty);
                    } catch (Exception e) {
                        log.warn("[AdminRefund] 재고 복원 실패 prodId={} reason={}",
                                item.getProduct().getProdId(), e.getMessage());
                    }
                }
            }
        }

        // ── 전체 환불이면 주문 상태 cancelled 처리 ────────────
        if (isFullRefund) {
            payment.markCanceled();
            paymentRepository.save(payment);
            order.markRefunded(payment.getPaymentId());
        } else {
            // 부분 환불: 결제는 그대로 유지 (추가 부분환불 가능하도록)
            // 향후 전액 환불됐는지 체크해서 cancelled 처리 고려 가능
            log.info("[AdminRefund] 부분환불 처리 완료 paymentId={} refundPrice={}", paymentId, refundPrice);
        }

        notifyRefundDone(payment, refundPrice);

        log.info("[AdminRefund] 주문 환불 완료 paymentId={} orderId={} refundPrice={} restoreStock={}",
                paymentId, order.getOrderId(), refundPrice, request.isRestoreStock());

        return ApiResponse.ok(PaymentRefundResponse.builder()
                .paymentId(payment.getPaymentId())
                .refundId(refund.getRefundId())
                .paymentSt(payment.getPaymentSt())
                .build());
    }

    // ── 내부 헬퍼 ──────────────────────────────────────────────

    private PaymentRefund saveRefundRecord(Integer paymentId, BigDecimal refundPrice, String reason) {
        PaymentRefund refund = PaymentRefund.builder()
                .paymentId(paymentId)
                .refundPrice(refundPrice)
                .refundSt(PaymentRefund.RefundSt.requested)
                .refundReason(reason)
                .build();
        return paymentRefundRepository.save(refund);
    }

    private void executePgRefund(Payment payment, BigDecimal refundPrice, String reason, PaymentRefund refund) {
        if (!hasText(payment.getProvider()) || !hasText(payment.getProviderPaymentId())) return;
        try {
            PaymentGateway gateway = paymentGatewayFactory.get(payment.getProvider());
            PaymentGatewayRefundResponse gwRes = gateway.refund(
                    PaymentGatewayRefundRequest.builder()
                            .paymentId(payment.getPaymentId())
                            .userId(payment.getUserId())
                            .providerPaymentId(payment.getProviderPaymentId())
                            .refundPrice(refundPrice)
                            .refundReason(reason)
                            .build()
            );
            if (!gwRes.isSuccess()) {
                refund.markFailed(LocalDateTime.now());
                paymentRefundRepository.save(refund);
                throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
            }
        } catch (BusinessException e) {
            if (e.getErrorCode() != ErrorCode.PAYMENT_INVALID_TARGET
                    && e.getErrorCode() != ErrorCode.BAD_REQUEST) {
                refund.markFailed(LocalDateTime.now());
                paymentRefundRepository.save(refund);
                throw e;
            }
            log.warn("[AdminRefund] PG 미지원 provider={}, 내부 처리만 진행", payment.getProvider());
        } catch (Exception e) {
            log.warn("[AdminRefund] PG 환불 실패 paymentId={} reason={}", payment.getPaymentId(), e.getMessage());
            refund.markFailed(LocalDateTime.now());
            paymentRefundRepository.save(refund);
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
    }

    private void validateRefundAmount(Payment payment, BigDecimal refundPrice) {
        if (refundPrice == null || refundPrice.signum() <= 0) {
            throw new BusinessException(ErrorCode.PAYMENT_REFUND_INVALID_AMOUNT);
        }
        BigDecimal paidAmount = payment.getCapturedPrice() != null
                ? payment.getCapturedPrice() : payment.getTotalPrice();
        if (paidAmount != null && refundPrice.compareTo(paidAmount) > 0) {
            throw new BusinessException(ErrorCode.PAYMENT_REFUND_INVALID_AMOUNT);
        }
    }

    private void syncTargetCanceled(Payment payment, boolean restoreStock) {
        if (payment.getTargetId() == null || !hasText(payment.getTargetType())) return;
        if (TARGET_MONTHLY_CHARGE.equals(payment.getTargetType())) {
            MonthlyCharge charge = monthlyChargeRepository.findById(payment.getTargetId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.BILLING_CHARGE_NOT_FOUND));
            charge.markUnpaid();
        }
    }

    private void notifyRefundDone(Payment payment, BigDecimal refundPrice) {
        if (payment == null || !hasText(payment.getUserId())) return;
        try {
            notificationService.notifyUser(
                    payment.getUserId(),
                    NotificationType.PAY_REFUND.name(),
                    "환불이 완료되었습니다. (결제ID=" + payment.getPaymentId()
                            + ", 환불금액=" + refundPrice.toPlainString() + "원)",
                    null,
                    TargetType.payment,
                    payment.getPaymentId(),
                    "/payments/" + payment.getPaymentId()
            );
        } catch (Exception e) {
            log.warn("[AdminRefund] 알림 실패 paymentId={} reason={}", payment.getPaymentId(), e.getMessage());
        }
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}