package org.myweb.uniplace.domain.payment.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.billing.domain.entity.MonthlyCharge;
import org.myweb.uniplace.domain.billing.repository.MonthlyChargeRepository;
import org.myweb.uniplace.domain.commerce.domain.entity.Order;
import org.myweb.uniplace.domain.commerce.repository.OrderRepository;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class RefundServiceImpl implements RefundService {

    private static final String ST_PAID = "paid";
    private static final String TARGET_TYPE_ORDER = "order";
    private static final String TARGET_TYPE_MONTHLY_CHARGE = "monthly_charge";

    private final PaymentRepository paymentRepository;
    private final PaymentRefundRepository paymentRefundRepository;
    private final PaymentGatewayFactory paymentGatewayFactory;
    private final OrderRepository orderRepository;
    private final MonthlyChargeRepository monthlyChargeRepository;

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
                    .refundPrice(refundPrice)
                    .refundReason(request.getRefundReason())
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
        if (paidAmount == null || refundPrice.compareTo(paidAmount) > 0) {
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
}
