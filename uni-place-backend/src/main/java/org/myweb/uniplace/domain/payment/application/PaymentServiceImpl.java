package org.myweb.uniplace.domain.payment.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.billing.domain.entity.MonthlyCharge;
import org.myweb.uniplace.domain.billing.repository.MonthlyChargeRepository;
import org.myweb.uniplace.domain.commerce.application.OrderService;
import org.myweb.uniplace.domain.commerce.application.RoomServiceOrderService;
import org.myweb.uniplace.domain.commerce.domain.entity.Order;
import org.myweb.uniplace.domain.commerce.repository.RoomServiceOrderRepository;
import org.myweb.uniplace.domain.commerce.domain.enums.OrderStatus;
import org.myweb.uniplace.domain.commerce.repository.OrderRepository;
import org.myweb.uniplace.domain.contract.domain.entity.Contract;
import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;
import org.myweb.uniplace.domain.contract.repository.ContractRepository;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentApproveRequest;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentPrepareMonthlyBatchRequest;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentPrepareRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentPrepareResponse;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentResponse;
import org.myweb.uniplace.domain.payment.application.gateway.PaymentGateway;
import org.myweb.uniplace.domain.payment.application.gateway.PaymentGatewayFactory;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayApproveRequest;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayApproveResponse;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayReadyRequest;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayReadyResponse;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentAttempt;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntent;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentIntentStatus;
import org.myweb.uniplace.domain.payment.domain.entity.ServiceGoods;
import org.myweb.uniplace.domain.payment.repository.PaymentIntentRepository;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.myweb.uniplace.domain.payment.repository.ServiceGoodsRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.util.IdGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {
    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private static final String ST_READY = "ready";
    private static final String ST_PENDING = "pending";
    private static final String ST_PAID = "paid";
    private static final String ST_CANCELLED = "cancelled";

    private static final String TARGET_TYPE_ORDER = "order";
    private static final String TARGET_TYPE_MONTHLY_CHARGE = "monthly_charge";
    private static final String MONTHLY_BATCH_IDEMPOTENCY_PREFIX = "MCB:";

    private final PaymentRepository paymentRepository;
    private final PaymentIntentRepository paymentIntentRepository;
    private final PaymentGatewayFactory paymentGatewayFactory;
    private final PaymentAttemptService paymentAttemptService;
    private final OrderRepository orderRepository;
    private final MonthlyChargeRepository monthlyChargeRepository;
    private final ContractRepository contractRepository;
    private final ServiceGoodsRepository serviceGoodsRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final RoomServiceOrderService roomServiceOrderService;
    private final RoomServiceOrderRepository roomServiceOrderRepository;
    private final OrderService orderService;

    @Value("${app.baseUrl:http://localhost:8080}")
    private String appBaseUrl;

    @Override
    public PaymentPrepareResponse prepare(String userId, PaymentPrepareRequest request) {
        validatePrepareRequest(request);
        PreparedTarget target = resolveTarget(userId, request);
        validateServiceGoodsMapping(request.getServiceGoodsId(), target.targetType());
        BigDecimal taxExScopeAmount = resolveTaxExScopeAmount(request.getTaxExScopeAmount(), target.totalPrice());
        BigDecimal taxScopeAmount = target.totalPrice().subtract(taxExScopeAmount);
        String idempotencyKey = blankToNull(request.getIdempotencyKey());

        Payment existingByTarget = paymentRepository
            .findTopByUserIdAndTargetTypeAndTargetIdAndPaymentStInOrderByPaymentIdDesc(
                userId,
                target.targetType(),
                target.targetId(),
                java.util.List.of(ST_READY, ST_PENDING)
            )
            .orElse(null);
        if (existingByTarget != null) {
            return reissueReadyForExisting(existingByTarget, target.itemName());
        }

        if (idempotencyKey != null) {
            Payment existing = paymentRepository
                .findTopByUserIdAndIdempotencyKeyOrderByPaymentIdDesc(userId, idempotencyKey)
                .orElse(null);
            if (existing != null) {
                if (ST_PAID.equalsIgnoreCase(existing.getPaymentSt())) {
                    return buildPrepareResponse(existing);
                }
                return reissueReadyForExisting(existing, target.itemName());
            }
        }

        Payment payment = Payment.builder()
            .userId(userId)
            .serviceGoodsId(request.getServiceGoodsId())
            .currency("KRW")
            .totalPrice(target.totalPrice())
            .taxScopePrice(taxScopeAmount)
            .taxExScopePrice(taxExScopeAmount)
            .taxFreePrice(taxExScopeAmount)
            .capturedPrice(BigDecimal.ZERO)
            .paymentMethodId(request.getPaymentMethodId())
            .provider(request.getProvider())
            .merchantUid(IdGenerator.generate("PAY"))
            .idempotencyKey(idempotencyKey)
            .targetId(target.targetId())
            .targetType(target.targetType())
            .paymentSt(ST_READY)
            .build();

        try {
            paymentRepository.save(payment);
        } catch (DataIntegrityViolationException e) {
            if (idempotencyKey != null) {
                Payment existing = paymentRepository
                    .findTopByUserIdAndIdempotencyKeyOrderByPaymentIdDesc(userId, idempotencyKey)
                    .orElse(null);
                if (existing != null) {
                    return buildPrepareResponse(existing);
                }
            }
            throw e;
        }

        String providerSlug = payment.getProvider() == null ? "kakao" : payment.getProvider().toLowerCase();
        String callbackQuery = "?pid=" + payment.getPaymentId()
            + "&mu=" + URLEncoder.encode(payment.getMerchantUid(), StandardCharsets.UTF_8);
        String approvalUrl = appBaseUrl + "/api/payments/callback/" + providerSlug + "/approval" + callbackQuery;
        String cancelUrl = appBaseUrl + "/api/payments/callback/" + providerSlug + "/cancel" + callbackQuery;
        String failUrl = appBaseUrl + "/api/payments/callback/" + providerSlug + "/fail" + callbackQuery;

        PaymentGateway gateway = paymentGatewayFactory.get(payment.getProvider());

        PaymentGatewayReadyResponse gwRes = gateway.ready(
            PaymentGatewayReadyRequest.builder()
                .paymentId(payment.getPaymentId())
                .userId(payment.getUserId())
                .orderId(payment.getMerchantUid())
                .itemName(target.itemName())
                .quantity(1)
                .totalPrice(payment.getTotalPrice())
                .taxFreePrice(payment.getTaxExScopePrice() == null ? BigDecimal.ZERO : payment.getTaxExScopePrice())
                .approvalUrl(approvalUrl)
                .cancelUrl(cancelUrl)
                .failUrl(failUrl)
                .build()
        );
        if (gwRes == null) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }

        PaymentIntent intent = PaymentIntent.builder()
            .paymentId(payment.getPaymentId())
            .provider(payment.getProvider())
            .intentSt(PaymentIntentStatus.READY_OK)
            .providerRefId(gwRes.getProviderRefId())
            .appSchemeUrl(firstNonBlank(
                gwRes.getRedirectAppUrl(),
                gwRes.getRedirectMobileUrl(),
                gwRes.getRedirectPcUrl()
            ))
            .returnUrl(approvalUrl)
            .pgReadyJson(gwRes.getPgReadyJson())
            .build();

        paymentIntentRepository.save(intent);

        return PaymentPrepareResponse.builder()
            .paymentId(payment.getPaymentId())
            .merchantUid(payment.getMerchantUid())
            .paymentSt(ST_READY)
            .providerRefId(gwRes.getProviderRefId())
            .redirectPcUrl(gwRes.getRedirectPcUrl())
            .redirectMobileUrl(gwRes.getRedirectMobileUrl())
            .redirectAppUrl(gwRes.getRedirectAppUrl())
            .build();
    }

    @Override
    public PaymentPrepareResponse prepareMonthlyChargeBatch(String userId, PaymentPrepareMonthlyBatchRequest request) {
        if (request == null || request.getServiceGoodsId() == null || !hasText(request.getProvider())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        List<Integer> chargeIds = normalizeChargeIds(request.getChargeIds());
        if (chargeIds.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        List<MonthlyCharge> charges = new ArrayList<>();
        List<Integer> payableChargeIds = new ArrayList<>();
        BigDecimal totalPrice = BigDecimal.ZERO;

        for (Integer chargeId : chargeIds) {
            MonthlyCharge charge = monthlyChargeRepository.findById(chargeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BILLING_CHARGE_NOT_FOUND));

            if (!contractRepository.existsByContractIdAndUser_UserId(charge.getContractId(), userId)) {
                throw new BusinessException(ErrorCode.PAYMENT_ACCESS_DENIED);
            }
            validateMonthlyChargeContractStatus(charge.getContractId());

            String st = String.valueOf(charge.getChargeSt()).toLowerCase();
            boolean payableStatus = MonthlyCharge.ST_UNPAID.equalsIgnoreCase(st);
            if (!payableStatus) {
                // 이미 납부된 청구는 제외하고 남은 미납분만 결제 준비
                continue;
            }

            if (charge.getPrice() == null) {
                throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
            }
            totalPrice = totalPrice.add(charge.getPrice());
            charges.add(charge);
            payableChargeIds.add(chargeId);
        }

        if (charges.isEmpty()) {
            throw new BusinessException(ErrorCode.BILLING_CHARGE_ALREADY_PAID);
        }

        validateServiceGoodsMapping(request.getServiceGoodsId(), TARGET_TYPE_MONTHLY_CHARGE);
        String idempotencyKey = MONTHLY_BATCH_IDEMPOTENCY_PREFIX + joinChargeIds(payableChargeIds);
        BigDecimal taxExScopeAmount = resolveTaxExScopeAmount(request.getTaxExScopeAmount(), totalPrice);
        BigDecimal taxScopeAmount = totalPrice.subtract(taxExScopeAmount);

        Payment existing = paymentRepository
            .findTopByUserIdAndIdempotencyKeyOrderByPaymentIdDesc(userId, idempotencyKey)
            .orElse(null);
        if (existing != null) {
            if (ST_PAID.equalsIgnoreCase(existing.getPaymentSt())) {
                return buildPrepareResponse(existing);
            }
            return reissueReadyForExisting(existing, "monthly-rent-batch");
        }

        Payment payment = Payment.builder()
            .userId(userId)
            .serviceGoodsId(request.getServiceGoodsId())
            .currency("KRW")
            .totalPrice(totalPrice)
            .taxScopePrice(taxScopeAmount)
            .taxExScopePrice(taxExScopeAmount)
            .taxFreePrice(taxExScopeAmount)
            .capturedPrice(BigDecimal.ZERO)
            .paymentMethodId(request.getPaymentMethodId())
            .provider(request.getProvider())
            .merchantUid(IdGenerator.generate("PAY"))
            .idempotencyKey(idempotencyKey)
            .targetId(charges.get(0).getChargeId())
            .targetType(TARGET_TYPE_MONTHLY_CHARGE)
            .paymentSt(ST_READY)
            .build();

        try {
            paymentRepository.save(payment);
        } catch (DataIntegrityViolationException e) {
            Payment dup = paymentRepository
                .findTopByUserIdAndIdempotencyKeyOrderByPaymentIdDesc(userId, idempotencyKey)
                .orElse(null);
            if (dup != null) {
                return buildPrepareResponse(dup);
            }
            throw e;
        }

        return readyPayment(payment, "monthly-rent-batch");
    }

    @Override
    public PaymentResponse approve(String userId, PaymentApproveRequest request) {
        return approveInternal(userId, request);
    }

    private PaymentPrepareResponse readyPayment(Payment payment, String itemName) {
        String providerSlug = payment.getProvider() == null ? "kakao" : payment.getProvider().toLowerCase();
        String callbackQuery = "?pid=" + payment.getPaymentId()
            + "&mu=" + URLEncoder.encode(payment.getMerchantUid(), StandardCharsets.UTF_8);
        String approvalUrl = appBaseUrl + "/api/payments/callback/" + providerSlug + "/approval" + callbackQuery;
        String cancelUrl = appBaseUrl + "/api/payments/callback/" + providerSlug + "/cancel" + callbackQuery;
        String failUrl = appBaseUrl + "/api/payments/callback/" + providerSlug + "/fail" + callbackQuery;

        PaymentGateway gateway = paymentGatewayFactory.get(payment.getProvider());
        PaymentGatewayReadyResponse gwRes = gateway.ready(
            PaymentGatewayReadyRequest.builder()
                .paymentId(payment.getPaymentId())
                .userId(payment.getUserId())
                .orderId(payment.getMerchantUid())
                .itemName(itemName)
                .quantity(1)
                .totalPrice(payment.getTotalPrice())
                .taxFreePrice(payment.getTaxExScopePrice() == null ? BigDecimal.ZERO : payment.getTaxExScopePrice())
                .approvalUrl(approvalUrl)
                .cancelUrl(cancelUrl)
                .failUrl(failUrl)
                .build()
        );
        if (gwRes == null) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }

        PaymentIntent intent = PaymentIntent.builder()
            .paymentId(payment.getPaymentId())
            .provider(payment.getProvider())
            .intentSt(PaymentIntentStatus.READY_OK)
            .providerRefId(gwRes.getProviderRefId())
            .appSchemeUrl(firstNonBlank(
                gwRes.getRedirectAppUrl(),
                gwRes.getRedirectMobileUrl(),
                gwRes.getRedirectPcUrl()
            ))
            .returnUrl(approvalUrl)
            .pgReadyJson(gwRes.getPgReadyJson())
            .build();
        paymentIntentRepository.save(intent);

        return PaymentPrepareResponse.builder()
            .paymentId(payment.getPaymentId())
            .merchantUid(payment.getMerchantUid())
            .paymentSt(ST_READY)
            .providerRefId(gwRes.getProviderRefId())
            .redirectPcUrl(gwRes.getRedirectPcUrl())
            .redirectMobileUrl(gwRes.getRedirectMobileUrl())
            .redirectAppUrl(gwRes.getRedirectAppUrl())
            .build();
    }

    private PaymentPrepareResponse reissueReadyForExisting(Payment payment, String itemName) {
        if (!ST_READY.equalsIgnoreCase(payment.getPaymentSt()) && !ST_PENDING.equalsIgnoreCase(payment.getPaymentSt())) {
            payment.markReady();
            paymentRepository.save(payment);
        }
        return readyPayment(payment, itemName);
    }

    @Override
    public PaymentResponse approveFromCallback(PaymentApproveRequest request) {
        return approveInternal(null, request);
    }

    @Override
    public void recordReturnedParams(Integer paymentId, String returnedParamsJson) {
        if (paymentId == null || !hasText(returnedParamsJson)) {
            return;
        }
        paymentIntentRepository
            .findTopByPaymentIdOrderByPaymentIntentIdDesc(paymentId)
            .ifPresent(intent -> intent.markReturned(returnedParamsJson));
    }

    @Override
    public void cancelFromCallback(Integer paymentId, String merchantUid) {
        Payment payment = getPaymentForCallback(paymentId, merchantUid);

        if (ST_PAID.equalsIgnoreCase(payment.getPaymentSt())) {
            return;
        }

        paymentIntentRepository
            .findTopByPaymentIdOrderByPaymentIntentIdDesc(payment.getPaymentId())
            .ifPresent(intent -> intent.markCanceled());

        payment.markCanceled();
        paymentRepository.save(payment);

        // 연결된 Order/RoomServiceOrder도 취소 처리
        cancelLinkedOrder(payment);
    }

    @Override
    public void failFromCallback(Integer paymentId, String merchantUid, String failCode, String failMessage) {
        Payment payment = getPaymentForCallback(paymentId, merchantUid);

        if (ST_PAID.equalsIgnoreCase(payment.getPaymentSt())) {
            return;
        }

        paymentIntentRepository
            .findTopByPaymentIdOrderByPaymentIntentIdDesc(payment.getPaymentId())
            .ifPresent(intent -> intent.markApproveFail(
                blankToNull(failCode),
                trimMessage(failMessage),
                null
            ));

        payment.markCanceled();
        paymentRepository.save(payment);
        paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.failed);
        notifyPaymentFailKor(payment, trimMessage(failMessage));

        // 연결된 Order/RoomServiceOrder도 취소 처리
        cancelLinkedOrder(payment);
    }

    private PaymentResponse approveInternal(String requesterUserId, PaymentApproveRequest request) {
        if (request == null || request.getPaymentId() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        Payment payment = paymentRepository.findById(request.getPaymentId())
            .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        if (!hasText(requesterUserId)) {
            validateCallbackRequest(payment, request.getMerchantUid());
        }
        assertOwnership(requesterUserId, payment);

        if (ST_PAID.equalsIgnoreCase(payment.getPaymentSt())) {
            return PaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .paymentSt(ST_PAID)
                .paidAt(payment.getPaidAt())
                .build();
        }

        if (ST_CANCELLED.equalsIgnoreCase(payment.getPaymentSt())) {
            throw new BusinessException(ErrorCode.PAYMENT_ALREADY_CANCELED);
        }

        validateTargetBeforeApprove(payment);

        PaymentIntent intent = paymentIntentRepository
            .findTopByPaymentIdOrderByPaymentIntentIdDesc(payment.getPaymentId())
            .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET));

        paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.requested);

        try {
            PaymentGateway gateway = paymentGatewayFactory.get(payment.getProvider());

            PaymentGatewayApproveResponse gwRes = gateway.approve(
                PaymentGatewayApproveRequest.builder()
                    .paymentId(payment.getPaymentId())
                    .userId(payment.getUserId())
                    .providerRefId(intent.getProviderRefId())
                    .pgToken(request.getPgToken())
                    .paymentKey(request.getPaymentKey())
                    .payToken(request.getPayToken())
                    .orderId(payment.getMerchantUid())
                    .amount(payment.getTotalPrice())
                    .build()
            );

            verifyApproveResultKor(payment, gwRes);

            intent.markApproveOk(gwRes.getPgApproveJson());
            paymentIntentRepository.save(intent);

            String providerPaymentId =
                hasText(gwRes.getProviderPaymentId())
                    ? gwRes.getProviderPaymentId()
                    : intent.getProviderRefId();

            validateProviderPaymentIdKor(payment, providerPaymentId);
            payment.updateProviderPaymentId(providerPaymentId);
            payment.markPaid(
                LocalDateTime.now(),
                gwRes.getCapturedPrice() == null ? payment.getTotalPrice() : gwRes.getCapturedPrice()
            );
            paymentRepository.save(payment);

            syncTargetPaid(payment);
            paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.approved);
            notifyPaymentSuccessKor(payment);

            // 룸서비스 주문인 경우 결제 완료 후 Slack + 어드민 알림
            if (TARGET_TYPE_ORDER.equals(payment.getTargetType()) && payment.getTargetId() != null) {
                try {
                    List<org.myweb.uniplace.domain.commerce.domain.entity.RoomServiceOrder> rsoList =
                        roomServiceOrderRepository.findByParentOrderId(payment.getTargetId());
                    for (org.myweb.uniplace.domain.commerce.domain.entity.RoomServiceOrder rso : rsoList) {
                        try { roomServiceOrderService.notifyOrderPaid(rso.getOrderId()); }
                        catch (Exception ex) { log.warn("[ORDER][NOTIFY] orderId={} reason={}", rso.getOrderId(), ex.getMessage()); }
                    }
                } catch (Exception e) {
                    log.warn("[ORDER][NOTIFY] paymentId={} reason={}", payment.getPaymentId(), e.getMessage());
                }
            }

            return PaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .paymentSt(ST_PAID)
                .paidAt(payment.getPaidAt())
                .build();
        } catch (RuntimeException e) {
            intent.markApproveFail("APPROVE_FAIL", trimMessage(e.getMessage()), null);
            paymentIntentRepository.save(intent);
            paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.failed);
            notifyPaymentFailKor(payment, trimMessage(e.getMessage()));
            throw e;
        }
    }

    @Override
    public void abandonByUser(String userId, Integer paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        assertOwnership(userId, payment);

        if (ST_PAID.equalsIgnoreCase(payment.getPaymentSt())) {
            return; // 이미 결제 완료된 경우 무시
        }
        if (ST_CANCELLED.equalsIgnoreCase(payment.getPaymentSt())) {
            // 이미 취소됐어도 Order 취소는 멱등성 보장
            cancelLinkedOrder(payment);
            return;
        }

        paymentIntentRepository
            .findTopByPaymentIdOrderByPaymentIntentIdDesc(payment.getPaymentId())
            .ifPresent(intent -> intent.markCanceled());

        payment.markCanceled();
        paymentRepository.save(payment);
        paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.failed);

        cancelLinkedOrder(payment);
    }

    @Override
    public PaymentResponse retry(String userId, Integer paymentId) {
        if (paymentId == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        assertOwnership(userId, payment);

        if (ST_PAID.equalsIgnoreCase(payment.getPaymentSt())) {
            throw new BusinessException(ErrorCode.PAYMENT_ALREADY_PAID);
        }

        payment.markReady();
        paymentRepository.save(payment);
        notifyPaymentRetryKor(payment);

        return PaymentResponse.builder()
            .paymentId(payment.getPaymentId())
            .paymentSt(payment.getPaymentSt())
            .build();
    }

    private void validatePrepareRequest(PaymentPrepareRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        if (request.getServiceGoodsId() == null || !hasText(request.getProvider())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        boolean hasOrder = request.getOrderId() != null;
        boolean hasCharge = request.getChargeId() != null;
        if (hasOrder == hasCharge) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
    }

    private PreparedTarget resolveTarget(String userId, PaymentPrepareRequest request) {
        if (request.getOrderId() != null) {
            Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

            if (!order.getUser().getUserId().equals(userId)) {
                throw new BusinessException(ErrorCode.ORDER_ACCESS_DENIED);
            }

            if (order.getOrderSt() != OrderStatus.ordered) {
                throw new BusinessException(ErrorCode.PAYMENT_ALREADY_PAID);
            }

            return new PreparedTarget(
                TARGET_TYPE_ORDER,
                order.getOrderId(),
                order.getTotalPrice(),
                "room-service"
            );
        }

        MonthlyCharge charge = monthlyChargeRepository.findById(request.getChargeId())
            .orElseThrow(() -> new BusinessException(ErrorCode.BILLING_CHARGE_NOT_FOUND));

        if (!contractRepository.existsByContractIdAndUser_UserId(charge.getContractId(), userId)) {
            throw new BusinessException(ErrorCode.PAYMENT_ACCESS_DENIED);
        }
        validateMonthlyChargeContractStatus(charge.getContractId());

        if (!MonthlyCharge.ST_UNPAID.equalsIgnoreCase(charge.getChargeSt())) {
            throw new BusinessException(ErrorCode.BILLING_CHARGE_ALREADY_PAID);
        }

        return new PreparedTarget(
            TARGET_TYPE_MONTHLY_CHARGE,
            charge.getChargeId(),
            charge.getPrice(),
            "monthly-rent"
        );
    }

    /** 결제 취소/실패 시 연결된 Order 취소 + 재고 복원 */
    private void cancelLinkedOrder(Payment payment) {
        if (!TARGET_TYPE_ORDER.equals(payment.getTargetType()) || payment.getTargetId() == null) {
            return;
        }
        try {
            String userId = payment.getUserId();
            if (userId == null) return;
            // OrderService.cancelOrder() 내부에서 재고 복원 + RoomServiceOrder 취소 모두 처리
            orderService.cancelOrder(userId, payment.getTargetId());
        } catch (Exception e) {
            log.warn("[PAYMENT][CANCEL_ORDER] paymentId={} reason={}", payment.getPaymentId(), e.getMessage());
        }
    }

    private void syncTargetPaid(Payment payment) {
        if (payment.getTargetId() == null || !hasText(payment.getTargetType())) {
            return;
        }

        if (TARGET_TYPE_ORDER.equals(payment.getTargetType())) {
            Order order = orderRepository.findById(payment.getTargetId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
            if (order.getPaymentId() != null && !Objects.equals(order.getPaymentId(), payment.getPaymentId())) {
                return;
            }
            order.completePayment(payment.getPaymentId());
            return;
        }

        if (TARGET_TYPE_MONTHLY_CHARGE.equals(payment.getTargetType())) {
            if (isMonthlyBatchPayment(payment)) {
                List<Integer> ids = parseMonthlyBatchChargeIds(payment.getIdempotencyKey());
                if (ids.isEmpty()) {
                    throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
                }
                BigDecimal total = BigDecimal.ZERO;
                for (Integer id : ids) {
                    MonthlyCharge c = monthlyChargeRepository.findById(id)
                        .orElseThrow(() -> new BusinessException(ErrorCode.BILLING_CHARGE_NOT_FOUND));
                    validateMonthlyChargeContractStatus(c.getContractId());
                    if (c.getPaymentId() != null && !Objects.equals(c.getPaymentId(), payment.getPaymentId())) {
                        throw new BusinessException(ErrorCode.BILLING_CHARGE_ALREADY_PAID);
                    }
                    if (c.getPrice() == null) {
                        throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
                    }
                    total = total.add(c.getPrice());
                    String st = String.valueOf(c.getChargeSt()).toLowerCase();
                    if (MonthlyCharge.ST_UNPAID.equalsIgnoreCase(st)) {
                        c.markPaid(payment.getPaymentId());
                        continue;
                    }
                    if (MonthlyCharge.ST_PAID.equalsIgnoreCase(st)
                        && Objects.equals(c.getPaymentId(), payment.getPaymentId())) {
                        continue;
                    }
                    throw new BusinessException(ErrorCode.BILLING_CHARGE_ALREADY_PAID);
                }
                if (payment.getTotalPrice() == null || total.compareTo(payment.getTotalPrice()) != 0) {
                    throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
                }
                return;
            }

            MonthlyCharge charge = monthlyChargeRepository.findById(payment.getTargetId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BILLING_CHARGE_NOT_FOUND));
            validateMonthlyChargeContractStatus(charge.getContractId());
            if (charge.getPaymentId() != null && !Objects.equals(charge.getPaymentId(), payment.getPaymentId())) {
                return;
            }
            charge.markPaid(payment.getPaymentId());
        }
    }

    private void validateTargetBeforeApprove(Payment payment) {
        if (payment.getTargetId() == null || !hasText(payment.getTargetType())) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }

        if (TARGET_TYPE_ORDER.equals(payment.getTargetType())) {
            Order order = orderRepository.findById(payment.getTargetId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

            if (order.getOrderSt() != OrderStatus.ordered) {
                throw new BusinessException(ErrorCode.PAYMENT_ALREADY_PAID);
            }
            if (order.getPaymentId() != null && !Objects.equals(order.getPaymentId(), payment.getPaymentId())) {
                throw new BusinessException(ErrorCode.PAYMENT_ALREADY_PAID);
            }
            if (order.getTotalPrice() == null || payment.getTotalPrice() == null
                || order.getTotalPrice().compareTo(payment.getTotalPrice()) != 0) {
                throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
            }
            return;
        }

        if (TARGET_TYPE_MONTHLY_CHARGE.equals(payment.getTargetType())) {
            if (isMonthlyBatchPayment(payment)) {
                List<Integer> ids = parseMonthlyBatchChargeIds(payment.getIdempotencyKey());
                if (ids.isEmpty()) {
                    throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
                }
                BigDecimal total = BigDecimal.ZERO;
                for (Integer id : ids) {
                    MonthlyCharge charge = monthlyChargeRepository.findById(id)
                        .orElseThrow(() -> new BusinessException(ErrorCode.BILLING_CHARGE_NOT_FOUND));
                    validateMonthlyChargeContractStatus(charge.getContractId());
                    String st = String.valueOf(charge.getChargeSt()).toLowerCase();
                    if (!MonthlyCharge.ST_UNPAID.equalsIgnoreCase(st)
                        && !(MonthlyCharge.ST_PAID.equalsIgnoreCase(st)
                        && Objects.equals(charge.getPaymentId(), payment.getPaymentId()))) {
                        throw new BusinessException(ErrorCode.BILLING_CHARGE_ALREADY_PAID);
                    }
                    if (charge.getPaymentId() != null && !Objects.equals(charge.getPaymentId(), payment.getPaymentId())) {
                        throw new BusinessException(ErrorCode.BILLING_CHARGE_ALREADY_PAID);
                    }
                    if (charge.getPrice() == null) {
                        throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
                    }
                    total = total.add(charge.getPrice());
                }
                if (payment.getTotalPrice() == null || total.compareTo(payment.getTotalPrice()) != 0) {
                    throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
                }
                return;
            }

            MonthlyCharge charge = monthlyChargeRepository.findById(payment.getTargetId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BILLING_CHARGE_NOT_FOUND));
            validateMonthlyChargeContractStatus(charge.getContractId());

            if (!MonthlyCharge.ST_UNPAID.equalsIgnoreCase(charge.getChargeSt())) {
                throw new BusinessException(ErrorCode.BILLING_CHARGE_ALREADY_PAID);
            }
            if (charge.getPaymentId() != null && !Objects.equals(charge.getPaymentId(), payment.getPaymentId())) {
                throw new BusinessException(ErrorCode.BILLING_CHARGE_ALREADY_PAID);
            }
            if (charge.getPrice() == null || payment.getTotalPrice() == null
                || charge.getPrice().compareTo(payment.getTotalPrice()) != 0) {
                throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
            }
            return;
        }

        throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
    }

    private void validateMonthlyChargeContractStatus(Integer contractId) {
        Contract contract = contractRepository.findById(contractId)
            .orElseThrow(() -> new BusinessException(ErrorCode.CONTRACT_NOT_FOUND));
        ContractStatus status = contract.getContractSt();
        if (status == null || status == ContractStatus.requested || status == ContractStatus.cancelled) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
    }

    private static String trimMessage(String message) {
        if (message == null || message.isBlank()) {
            return "결제 승인 실패";
        }
        return message.length() > 255 ? message.substring(0, 255) : message;
    }

    private static String blankToNull(String value) {
        return hasText(value) ? value : null;
    }

    private static BigDecimal resolveTaxExScopeAmount(BigDecimal requestedTaxEx, BigDecimal totalPrice) {
        if (totalPrice == null || totalPrice.signum() < 0) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
        if (requestedTaxEx == null) {
            return BigDecimal.ZERO;
        }
        if (requestedTaxEx.signum() < 0 || requestedTaxEx.compareTo(totalPrice) > 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        return requestedTaxEx;
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private static boolean isMonthlyBatchPayment(Payment payment) {
        return payment != null
            && TARGET_TYPE_MONTHLY_CHARGE.equals(payment.getTargetType())
            && hasText(payment.getIdempotencyKey())
            && payment.getIdempotencyKey().startsWith(MONTHLY_BATCH_IDEMPOTENCY_PREFIX);
    }

    private static List<Integer> normalizeChargeIds(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        LinkedHashSet<Integer> dedup = new LinkedHashSet<>();
        for (Integer id : ids) {
            if (id != null && id > 0) dedup.add(id);
        }
        return new ArrayList<>(dedup);
    }

    private static List<Integer> parseMonthlyBatchChargeIds(String idempotencyKey) {
        if (!hasText(idempotencyKey) || !idempotencyKey.startsWith(MONTHLY_BATCH_IDEMPOTENCY_PREFIX)) {
            return List.of();
        }
        String raw = idempotencyKey.substring(MONTHLY_BATCH_IDEMPOTENCY_PREFIX.length());
        if (!hasText(raw)) return List.of();

        LinkedHashSet<Integer> out = new LinkedHashSet<>();
        for (String token : raw.split(",")) {
            String t = token.trim();
            if (t.isEmpty()) continue;
            try {
                int id = Integer.parseInt(t);
                if (id > 0) out.add(id);
            } catch (NumberFormatException ignored) {
                return List.of();
            }
        }
        return new ArrayList<>(out);
    }

    private static String joinChargeIds(List<Integer> ids) {
        return String.join(",", ids.stream().map(String::valueOf).toList());
    }

    private PaymentPrepareResponse buildPrepareResponse(Payment payment) {
        PaymentIntent intent = paymentIntentRepository
            .findTopByPaymentIdOrderByPaymentIntentIdDesc(payment.getPaymentId())
            .orElse(null);

        RedirectUrls redirectUrls = parseRedirectUrls(intent);

        return PaymentPrepareResponse.builder()
            .paymentId(payment.getPaymentId())
            .merchantUid(payment.getMerchantUid())
            .paymentSt(payment.getPaymentSt())
            .providerRefId(intent != null ? intent.getProviderRefId() : null)
            .redirectPcUrl(redirectUrls.redirectPcUrl())
            .redirectMobileUrl(redirectUrls.redirectMobileUrl())
            .redirectAppUrl(redirectUrls.redirectAppUrl())
            .build();
    }

    private Payment getPaymentForCallback(Integer paymentId, String merchantUid) {
        if (paymentId == null || !hasText(merchantUid)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));
        validateCallbackRequest(payment, merchantUid);
        return payment;
    }

    private void validateCallbackRequest(Payment payment, String merchantUid) {
        if (!hasText(merchantUid) || !merchantUid.equals(payment.getMerchantUid())) {
            throw new BusinessException(ErrorCode.PAYMENT_ACCESS_DENIED);
        }
    }

    private void assertOwnership(String requesterUserId, Payment payment) {
        if (!hasText(requesterUserId)) {
            return;
        }
        if (!requesterUserId.equals(payment.getUserId())) {
            throw new BusinessException(ErrorCode.PAYMENT_ACCESS_DENIED);
        }
    }

    private void validateServiceGoodsMapping(Integer serviceGoodsId, String targetType) {
        ServiceGoods serviceGoods = serviceGoodsRepository.findById(serviceGoodsId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET));

        if (serviceGoods.getIsActive() != null && serviceGoods.getIsActive() == 0) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }

        String goodsCd = blankToNull(serviceGoods.getServiceGoodsCd());
        if (!hasText(goodsCd)) {
            return;
        }

        String normalizedCd = goodsCd.toLowerCase();
        if (TARGET_TYPE_ORDER.equals(targetType) && TARGET_TYPE_MONTHLY_CHARGE.equals(normalizedCd)) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
        if (TARGET_TYPE_MONTHLY_CHARGE.equals(targetType) && TARGET_TYPE_ORDER.equals(normalizedCd)) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
    }

    private void verifyApproveResult(Payment payment, PaymentGatewayApproveResponse gwRes) {
        if (gwRes == null || !isApprovedStatus(gwRes.getGatewayStatus())) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
        if (!hasText(gwRes.getProviderPaymentId())) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
        if (hasText(gwRes.getMerchantUid()) && !payment.getMerchantUid().equals(gwRes.getMerchantUid())) {
            safeNotifyAdmins(
                NotificationType.PAY_STATUS_MISMATCH.name(),
                "결제 상태 불일치(merchantUid). paymentId=" + payment.getPaymentId()
                    + ", expected=" + payment.getMerchantUid()
                    + ", actual=" + gwRes.getMerchantUid(),
                payment.getUserId(),
                payment.getPaymentId(),
                "/admin/payments/" + payment.getPaymentId()
            );
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
        if (gwRes.getCapturedPrice() != null
            && payment.getTotalPrice() != null
            && payment.getTotalPrice().compareTo(gwRes.getCapturedPrice()) != 0) {
            safeNotifyAdmins(
                NotificationType.PAY_STATUS_MISMATCH.name(),
                "결제 상태 불일치(amount). paymentId=" + payment.getPaymentId()
                    + ", expected=" + payment.getTotalPrice()
                    + ", actual=" + gwRes.getCapturedPrice(),
                payment.getUserId(),
                payment.getPaymentId(),
                "/admin/payments/" + payment.getPaymentId()
            );
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
        if (hasText(gwRes.getCurrency())
            && hasText(payment.getCurrency())
            && !payment.getCurrency().equalsIgnoreCase(gwRes.getCurrency())) {
            safeNotifyAdmins(
                NotificationType.PAY_STATUS_MISMATCH.name(),
                "결제 상태 불일치(currency). paymentId=" + payment.getPaymentId()
                    + ", expected=" + payment.getCurrency()
                    + ", actual=" + gwRes.getCurrency(),
                payment.getUserId(),
                payment.getPaymentId(),
                "/admin/payments/" + payment.getPaymentId()
            );
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
    }

    private void validateProviderPaymentId(Payment payment, String providerPaymentId) {
        if (!hasText(providerPaymentId)) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
        if (hasText(payment.getProviderPaymentId()) && !payment.getProviderPaymentId().equals(providerPaymentId)) {
            safeNotifyAdmins(
                NotificationType.PAY_DUPLICATE.name(),
                "결제 거래번호 충돌 감지. paymentId=" + payment.getPaymentId()
                    + ", provider=" + payment.getProvider()
                    + ", existingProviderPaymentId=" + payment.getProviderPaymentId()
                    + ", requestedProviderPaymentId=" + providerPaymentId,
                payment.getUserId(),
                payment.getPaymentId(),
                "/admin/payments/" + payment.getPaymentId()
            );
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }

        Payment existing = paymentRepository
            .findByProviderAndProviderPaymentId(payment.getProvider(), providerPaymentId)
            .orElse(null);

        if (existing != null && !Objects.equals(existing.getPaymentId(), payment.getPaymentId())) {
            safeNotifyAdmins(
                NotificationType.PAY_DUPLICATE.name(),
                "중복 결제 감지. paymentId=" + payment.getPaymentId()
                    + ", duplicatePaymentId=" + existing.getPaymentId()
                    + ", provider=" + payment.getProvider()
                    + ", providerPaymentId=" + providerPaymentId,
                payment.getUserId(),
                payment.getPaymentId(),
                "/admin/payments/" + payment.getPaymentId()
            );
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
    }

    private static boolean isApprovedStatus(String status) {
        if (!hasText(status)) {
            return false;
        }
        String normalized = status.trim().toUpperCase();
        return "APPROVED".equals(normalized)
            || "DONE".equals(normalized)
            || "PAID".equals(normalized)
            || "SUCCESS".equals(normalized)
            || "COMPLETED".equals(normalized);
    }

    private RedirectUrls parseRedirectUrls(PaymentIntent intent) {
        if (intent == null) {
            return new RedirectUrls(null, null, null);
        }

        String fallbackApp = intent.getAppSchemeUrl();
        String redirectPcUrl = null;
        String redirectMobileUrl = null;
        String redirectAppUrl = fallbackApp;

        if (hasText(intent.getPgReadyJson())) {
            try {
                JsonNode json = objectMapper.readTree(intent.getPgReadyJson());
                redirectPcUrl = firstText(json,
                    "redirectPcUrl",
                    "next_redirect_pc_url",
                    "nextRedirectPcUrl",
                    "paymentPageUrl");
                redirectMobileUrl = firstText(json,
                    "redirectMobileUrl",
                    "next_redirect_mobile_url",
                    "nextRedirectMobileUrl",
                    "mobileAppUrl");
                String parsedApp = firstText(json,
                    "redirectAppUrl",
                    "next_redirect_app_url",
                    "nextRedirectAppUrl",
                    "appSchemeUrl",
                    "android_app_scheme",
                    "ios_app_scheme");
                if (hasText(parsedApp)) {
                    redirectAppUrl = parsedApp;
                }
            } catch (Exception ignored) {
                // fallback to app_scheme_url only
            }
        }

        if (!hasText(redirectPcUrl) && hasText(redirectAppUrl)) {
            redirectPcUrl = redirectAppUrl;
        }
        if (!hasText(redirectMobileUrl) && hasText(redirectAppUrl)) {
            redirectMobileUrl = redirectAppUrl;
        }

        return new RedirectUrls(redirectPcUrl, redirectMobileUrl, redirectAppUrl);
    }

    private static String firstText(JsonNode node, String... candidates) {
        for (String candidate : candidates) {
            JsonNode value = node.get(candidate);
            if (value != null && value.isTextual() && hasText(value.asText())) {
                return value.asText();
            }
        }
        return null;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private void verifyApproveResultKor(Payment payment, PaymentGatewayApproveResponse gwRes) {
        if (gwRes == null || !isApprovedStatus(gwRes.getGatewayStatus())) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
        if (!hasText(gwRes.getProviderPaymentId())) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
        if (hasText(gwRes.getMerchantUid()) && !payment.getMerchantUid().equals(gwRes.getMerchantUid())) {
            safeNotifyAdmins(
                NotificationType.PAY_STATUS_MISMATCH.name(),
                "결제 상태 불일치 감지(merchantUid). paymentId=" + payment.getPaymentId()
                    + ", 예상값=" + payment.getMerchantUid()
                    + ", 실제값=" + gwRes.getMerchantUid(),
                payment.getUserId(),
                payment.getPaymentId(),
                "/admin/payments/" + payment.getPaymentId()
            );
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
        if (gwRes.getCapturedPrice() != null
            && payment.getTotalPrice() != null
            && payment.getTotalPrice().compareTo(gwRes.getCapturedPrice()) != 0) {
            safeNotifyAdmins(
                NotificationType.PAY_STATUS_MISMATCH.name(),
                "결제 상태 불일치 감지(amount). paymentId=" + payment.getPaymentId()
                    + ", 예상값=" + payment.getTotalPrice()
                    + ", 실제값=" + gwRes.getCapturedPrice(),
                payment.getUserId(),
                payment.getPaymentId(),
                "/admin/payments/" + payment.getPaymentId()
            );
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
        if (hasText(gwRes.getCurrency())
            && hasText(payment.getCurrency())
            && !payment.getCurrency().equalsIgnoreCase(gwRes.getCurrency())) {
            safeNotifyAdmins(
                NotificationType.PAY_STATUS_MISMATCH.name(),
                "결제 상태 불일치 감지(currency). paymentId=" + payment.getPaymentId()
                    + ", 예상값=" + payment.getCurrency()
                    + ", 실제값=" + gwRes.getCurrency(),
                payment.getUserId(),
                payment.getPaymentId(),
                "/admin/payments/" + payment.getPaymentId()
            );
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
    }

    private void validateProviderPaymentIdKor(Payment payment, String providerPaymentId) {
        if (!hasText(providerPaymentId)) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
        if (hasText(payment.getProviderPaymentId()) && !payment.getProviderPaymentId().equals(providerPaymentId)) {
            safeNotifyAdmins(
                NotificationType.PAY_DUPLICATE.name(),
                "결제 거래번호 충돌 감지. paymentId=" + payment.getPaymentId()
                    + ", provider=" + payment.getProvider()
                    + ", existingProviderPaymentId=" + payment.getProviderPaymentId()
                    + ", requestedProviderPaymentId=" + providerPaymentId,
                payment.getUserId(),
                payment.getPaymentId(),
                "/admin/payments/" + payment.getPaymentId()
            );
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }

        Payment existing = paymentRepository
            .findByProviderAndProviderPaymentId(payment.getProvider(), providerPaymentId)
            .orElse(null);

        if (existing != null && !Objects.equals(existing.getPaymentId(), payment.getPaymentId())) {
            safeNotifyAdmins(
                NotificationType.PAY_DUPLICATE.name(),
                "중복 결제가 감지되었습니다. paymentId=" + payment.getPaymentId()
                    + ", duplicatePaymentId=" + existing.getPaymentId()
                    + ", provider=" + payment.getProvider()
                    + ", providerPaymentId=" + providerPaymentId,
                payment.getUserId(),
                payment.getPaymentId(),
                "/admin/payments/" + payment.getPaymentId()
            );
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
    }

    private void notifyPaymentSuccessKor(Payment payment) {
        if (payment == null || !hasText(payment.getUserId())) {
            return;
        }
        String msg = "결제가 완료되었습니다. (paymentId=" + payment.getPaymentId()
            + ", 결제금액=" + payment.getCapturedPrice() + "원)";
        safeNotifyUser(payment.getUserId(), NotificationType.PAY_OK.name(), msg, payment.getPaymentId());
    }

    private void notifyPaymentFailKor(Payment payment, String reason) {
        if (payment == null || !hasText(payment.getUserId())) {
            return;
        }
        String failReason = hasText(reason) ? " 사유: " + reason : "";
        String msg = "결제에 실패했습니다. 다시 시도해 주세요. (paymentId=" + payment.getPaymentId() + ")" + failReason;
        safeNotifyUser(payment.getUserId(), NotificationType.PAY_FAIL.name(), msg, payment.getPaymentId());
    }

    private void notifyPaymentRetryKor(Payment payment) {
        if (payment == null || !hasText(payment.getUserId())) {
            return;
        }
        String msg = "결제를 다시 시도합니다. (paymentId=" + payment.getPaymentId() + ")";
        safeNotifyUser(payment.getUserId(), NotificationType.PAY_RETRY.name(), msg, payment.getPaymentId());
    }

    private void notifyPaymentSuccess(Payment payment) {
        if (payment == null || !hasText(payment.getUserId())) {
            return;
        }
        String msg = "결제가 완료되었습니다. (paymentId=" + payment.getPaymentId()
            + ", 금액=" + payment.getCapturedPrice() + "원)";
        safeNotifyUser(payment.getUserId(), NotificationType.PAY_OK.name(), msg, payment.getPaymentId());
    }

    private void notifyPaymentFail(Payment payment, String reason) {
        if (payment == null || !hasText(payment.getUserId())) {
            return;
        }
        String failReason = hasText(reason) ? " 사유: " + reason : "";
        String msg = "결제에 실패했습니다. 다시 시도해주세요. (paymentId=" + payment.getPaymentId() + ")" + failReason;
        safeNotifyUser(payment.getUserId(), NotificationType.PAY_FAIL.name(), msg, payment.getPaymentId());
    }

    private void notifyPaymentRetry(Payment payment) {
        if (payment == null || !hasText(payment.getUserId())) {
            return;
        }
        String msg = "결제를 다시 시도합니다. (paymentId=" + payment.getPaymentId() + ")";
        safeNotifyUser(payment.getUserId(), NotificationType.PAY_RETRY.name(), msg, payment.getPaymentId());
    }

    private void safeNotifyUser(String receiverId, String code, String message, Integer paymentId) {
        try {
            notificationService.notifyUser(
                receiverId,
                code,
                message,
                null,
                TargetType.payment,
                paymentId,
                "/payments/" + paymentId
            );
        } catch (Exception e) {
            log.warn("[PAYMENT][NOTIFY] failed code={} paymentId={} reason={}",
                code, paymentId, trimMessage(e.getMessage()));
        }
    }

    private void safeNotifyAdmins(
        String code,
        String message,
        String senderId,
        Integer paymentId,
        String urlPath
    ) {
        try {
            notificationService.notifyAdmins(
                code,
                message,
                senderId,
                TargetType.payment,
                paymentId,
                urlPath
            );
        } catch (Exception e) {
            log.warn("[PAYMENT][NOTIFY][ADMIN] failed code={} paymentId={} reason={}",
                code, paymentId, trimMessage(e.getMessage()));
        }
    }

    private record PreparedTarget(
        String targetType,
        Integer targetId,
        BigDecimal totalPrice,
        String itemName
    ) {
    }

    private record RedirectUrls(
        String redirectPcUrl,
        String redirectMobileUrl,
        String redirectAppUrl
    ) {
    }
}
