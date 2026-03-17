package org.myweb.uniplace.domain.payment.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.billing.domain.entity.MonthlyCharge;
import org.myweb.uniplace.domain.billing.repository.MonthlyChargeRepository;
import org.myweb.uniplace.domain.commerce.domain.entity.Order;
import org.myweb.uniplace.domain.commerce.repository.OrderRepository;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
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
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class RefundServiceImpl implements RefundService {
    private static final Logger log = LoggerFactory.getLogger(RefundServiceImpl.class);

    private static final String ST_PAID = "paid";
    private static final String TARGET_TYPE_ORDER = "order";
    private static final String TARGET_TYPE_MONTHLY_CHARGE = "monthly_charge";

    private final PaymentRepository paymentRepository;
    private final PaymentRefundRepository paymentRefundRepository;
    private final PaymentGatewayFactory paymentGatewayFactory;
    private final OrderRepository orderRepository;
    private final MonthlyChargeRepository monthlyChargeRepository;
    private final NotificationService notificationService;

    @Override
    public PaymentRefundResponse refund(String userId, PaymentRefundRequest request) {
        if (userId == null || userId.isBlank()) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        if (request == null || request.getPaymentId() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        Payment payment = paymentRepository.findById(request.getPaymentId())
            .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        if (!userId.equals(payment.getUserId())) {
            throw new BusinessException(ErrorCode.PAYMENT_ACCESS_DENIED);
        }

        if (!ST_PAID.equalsIgnoreCase(payment.getPaymentSt())) {
            throw new BusinessException(ErrorCode.PAYMENT_REFUND_NOT_ALLOWED);
        }

        BigDecimal refundPrice = request.getRefundPrice() == null
            ? payment.getCapturedPrice()
            : request.getRefundPrice();
        validateRefundAmount(payment, refundPrice);

        PaymentRefund refund = PaymentRefund.builder()
            .paymentId(payment.getPaymentId())
            .refundPrice(refundPrice)
            .refundSt(PaymentRefund.RefundSt.requested)
            .refundReason(request.getRefundReason())
            .build();
        paymentRefundRepository.save(refund);

        if (hasText(payment.getProvider()) && hasText(payment.getProviderPaymentId())) {
            PaymentGateway gateway = paymentGatewayFactory.get(payment.getProvider());
            PaymentGatewayRefundResponse gwRes = gateway.refund(
                PaymentGatewayRefundRequest.builder()
                    .paymentId(payment.getPaymentId())
                    .userId(payment.getUserId())
                    .providerPaymentId(payment.getProviderPaymentId())
                    .orderNo(payment.getMerchantUid())
                    .refundPrice(refundPrice)
                    .refundReason(request.getRefundReason())
                    .originalTotalPrice(payment.getCapturedPrice() != null ? payment.getCapturedPrice() : payment.getTotalPrice())
                    .originalTaxScopePrice(payment.getTaxScopePrice())
                    .originalTaxExScopePrice(payment.getTaxExScopePrice())
                    .originalEnvironmentDepositAmount(BigDecimal.ZERO)
                    .build()
            );

            if (!gwRes.isSuccess()) {
                throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
            }
        }

        refund.markDone(LocalDateTime.now());
        paymentRefundRepository.save(refund);

        payment.markCanceled();
        paymentRepository.save(payment);
        syncTargetCanceled(payment);
        notifyRefundDone(payment, refundPrice);

        return PaymentRefundResponse.builder()
            .paymentId(payment.getPaymentId())
            .refundId(refund.getRefundId())
            .paymentSt(payment.getPaymentSt())
            .build();
    }

    private void validateRefundAmount(Payment payment, BigDecimal refundPrice) {
        if (refundPrice == null || refundPrice.signum() <= 0) {
            throw new BusinessException(ErrorCode.PAYMENT_REFUND_INVALID_AMOUNT);
        }

        BigDecimal paidAmount = payment.getCapturedPrice() == null
            ? payment.getTotalPrice()
            : payment.getCapturedPrice();
        if (paidAmount == null) {
            throw new BusinessException(ErrorCode.PAYMENT_REFUND_INVALID_AMOUNT);
        }

        BigDecimal refundedAmount = paymentRefundRepository.sumRefundPriceByPaymentIdAndRefundSt(
            payment.getPaymentId(),
            PaymentRefund.RefundSt.done
        );
        BigDecimal refundableAmount = paidAmount.subtract(refundedAmount == null ? BigDecimal.ZERO : refundedAmount);
        if (refundableAmount.signum() <= 0 || refundPrice.compareTo(refundableAmount) > 0) {
            throw new BusinessException(ErrorCode.PAYMENT_REFUND_INVALID_AMOUNT);
        }
    }

    private void syncTargetCanceled(Payment payment) {
        if (payment.getTargetId() == null || !hasText(payment.getTargetType())) {
            return;
        }

        if (TARGET_TYPE_ORDER.equals(payment.getTargetType())) {
            Order order = orderRepository.findById(payment.getTargetId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
            order.markRefunded(payment.getPaymentId());
            return;
        }

        if (TARGET_TYPE_MONTHLY_CHARGE.equals(payment.getTargetType())) {
            MonthlyCharge charge = monthlyChargeRepository.findById(payment.getTargetId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BILLING_CHARGE_NOT_FOUND));
            charge.markUnpaid();
        }
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private void notifyRefundDone(Payment payment, BigDecimal refundPrice) {
        if (payment == null || !hasText(payment.getUserId())) {
            return;
        }
        try {
            notificationService.notifyUser(
                payment.getUserId(),
                NotificationType.PAY_REFUND.name(),
                "환불이 완료되었습니다. (paymentId=" + payment.getPaymentId()
                    + ", 환불금액=" + refundPrice + "원)",
                null,
                TargetType.payment,
                payment.getPaymentId(),
                "/payments/" + payment.getPaymentId()
            );
        } catch (Exception e) {
            log.warn("[PAYMENT][NOTIFY] refund notify failed paymentId={} reason={}",
                payment.getPaymentId(), e.getMessage());
        }
    }
}
