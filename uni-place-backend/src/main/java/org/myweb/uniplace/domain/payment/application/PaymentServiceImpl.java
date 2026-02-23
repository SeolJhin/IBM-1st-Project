package org.myweb.uniplace.domain.payment.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.billing.domain.entity.MonthlyCharge;
import org.myweb.uniplace.domain.billing.repository.MonthlyChargeRepository;
import org.myweb.uniplace.domain.commerce.domain.entity.Order;
import org.myweb.uniplace.domain.commerce.domain.enums.OrderStatus;
import org.myweb.uniplace.domain.commerce.repository.OrderRepository;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentApproveRequest;
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
import org.myweb.uniplace.domain.payment.repository.PaymentIntentRepository;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.util.IdGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private static final String ST_READY = "ready";
    private static final String ST_PAID = "paid";

    private static final String TARGET_TYPE_ORDER = "order";
    private static final String TARGET_TYPE_MONTHLY_CHARGE = "monthly_charge";

    private final PaymentRepository paymentRepository;
    private final PaymentIntentRepository paymentIntentRepository;
    private final PaymentGatewayFactory paymentGatewayFactory;
    private final PaymentAttemptService paymentAttemptService;
    private final OrderRepository orderRepository;
    private final MonthlyChargeRepository monthlyChargeRepository;

    @Value("${app.baseUrl:http://localhost:8080}")
    private String appBaseUrl;

    @Override
    public PaymentPrepareResponse prepare(String userId, PaymentPrepareRequest request) {
        validatePrepareRequest(request);
        PreparedTarget target = resolveTarget(userId, request);

        Payment payment = Payment.builder()
            .userId(userId)
            .serviceGoodsId(request.getServiceGoodsId())
            .currency("KRW")
            .totalPrice(target.totalPrice())
            .capturedPrice(BigDecimal.ZERO)
            .paymentMethodId(request.getPaymentMethodId())
            .provider(request.getProvider())
            .merchantUid(IdGenerator.generate("PAY"))
            .idempotencyKey(blankToNull(request.getIdempotencyKey()))
            .targetId(target.targetId())
            .targetType(target.targetType())
            .paymentSt(ST_READY)
            .build();

        paymentRepository.save(payment);

        String providerSlug = payment.getProvider() == null ? "kakao" : payment.getProvider().toLowerCase();
        String approvalUrl = appBaseUrl + "/api/payments/callback/" + providerSlug + "/approval?pid=" + payment.getPaymentId();
        String cancelUrl = appBaseUrl + "/api/payments/callback/" + providerSlug + "/cancel?pid=" + payment.getPaymentId();
        String failUrl = appBaseUrl + "/api/payments/callback/" + providerSlug + "/fail?pid=" + payment.getPaymentId();

        PaymentGateway gateway = paymentGatewayFactory.get(payment.getProvider());

        PaymentGatewayReadyResponse gwRes = gateway.ready(
            PaymentGatewayReadyRequest.builder()
                .paymentId(payment.getPaymentId())
                .userId(payment.getUserId())
                .orderId(payment.getMerchantUid())
                .itemName(target.itemName())
                .quantity(1)
                .totalPrice(target.totalPrice())
                .taxFreePrice(BigDecimal.ZERO)
                .approvalUrl(approvalUrl)
                .cancelUrl(cancelUrl)
                .failUrl(failUrl)
                .build()
        );

        PaymentIntent intent = PaymentIntent.builder()
            .paymentId(payment.getPaymentId())
            .intentSt(PaymentIntentStatus.READY_OK)
            .providerRefId(gwRes.getProviderRefId())
            .appSchemeUrl(gwRes.getRedirectAppUrl())
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
    public PaymentResponse approve(PaymentApproveRequest request) {
        Payment payment = paymentRepository.findById(request.getPaymentId())
            .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));

        PaymentIntent intent = paymentIntentRepository
            .findTopByPaymentIdOrderByPaymentIntentIdDesc(payment.getPaymentId())
            .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));

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
                    .orderId(payment.getMerchantUid())
                    .amount(payment.getTotalPrice())
                    .build()
            );

            intent.markApproveOk(gwRes.getPgApproveJson());
            paymentIntentRepository.save(intent);

            String providerPaymentId =
                hasText(gwRes.getProviderPaymentId())
                    ? gwRes.getProviderPaymentId()
                    : intent.getProviderRefId();

            payment.updateProviderPaymentId(providerPaymentId);
            payment.markPaid(LocalDateTime.now(), payment.getTotalPrice());
            paymentRepository.save(payment);

            syncTargetPaid(payment);
            paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.approved);

            return PaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .paymentSt(ST_PAID)
                .paidAt(payment.getPaidAt())
                .build();
        } catch (RuntimeException e) {
            intent.markApproveFail("APPROVE_FAIL", trimMessage(e.getMessage()), null);
            paymentIntentRepository.save(intent);
            paymentAttemptService.recordAttemptSt(payment.getPaymentId(), PaymentAttempt.AttemptSt.failed);
            throw e;
        }
    }

    @Override
    public PaymentResponse retry(Integer paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));

        payment.markReady();
        paymentRepository.save(payment);

        return PaymentResponse.builder()
            .paymentId(payment.getPaymentId())
            .paymentSt(payment.getPaymentSt())
            .build();
    }

    private void validatePrepareRequest(PaymentPrepareRequest request) {
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
                throw new BusinessException(ErrorCode.BAD_REQUEST);
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

        if (!MonthlyCharge.ST_UNPAID.equalsIgnoreCase(charge.getChargeSt())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        return new PreparedTarget(
            TARGET_TYPE_MONTHLY_CHARGE,
            charge.getChargeId(),
            charge.getPrice(),
            "monthly-rent"
        );
    }

    private void syncTargetPaid(Payment payment) {
        if (payment.getTargetId() == null || !hasText(payment.getTargetType())) {
            return;
        }

        if (TARGET_TYPE_ORDER.equals(payment.getTargetType())) {
            Order order = orderRepository.findById(payment.getTargetId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
            order.completePayment(payment.getPaymentId());
            return;
        }

        if (TARGET_TYPE_MONTHLY_CHARGE.equals(payment.getTargetType())) {
            MonthlyCharge charge = monthlyChargeRepository.findById(payment.getTargetId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BILLING_CHARGE_NOT_FOUND));
            charge.markPaid(payment.getPaymentId());
        }
    }

    private static String trimMessage(String message) {
        if (message == null || message.isBlank()) {
            return "payment approve failed";
        }
        return message.length() > 255 ? message.substring(0, 255) : message;
    }

    private static String blankToNull(String value) {
        return hasText(value) ? value : null;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private record PreparedTarget(
        String targetType,
        Integer targetId,
        BigDecimal totalPrice,
        String itemName
    ) {
    }
}
