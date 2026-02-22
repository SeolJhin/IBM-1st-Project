package org.myweb.uniplace.domain.payment.application;

import lombok.RequiredArgsConstructor;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class RefundServiceImpl implements RefundService {

    private final PaymentRepository paymentRepository;
    private final PaymentRefundRepository paymentRefundRepository;
    private final PaymentGatewayFactory paymentGatewayFactory;

    private static final String ST_DONE = "done";

    @Override
    public PaymentRefundResponse refund(PaymentRefundRequest request) {

        Payment payment = paymentRepository.findById(request.getPaymentId())
            .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        // 1) create refund record (requested)
        PaymentRefund refund = PaymentRefund.builder()
            .paymentId(payment.getPaymentId())
            .refundPrice(request.getRefundPrice())
            .refundSt(PaymentRefund.RefundSt.requested)
            .refundReason(request.getRefundReason())
            .build();

        paymentRefundRepository.save(refund);

        // 2) gateway refund (KAKAO/NAVER/TOSS)
        // 승인 실패 등으로 providerPaymentId가 없으면 내부 취소만 진행
        if (payment.getProvider() != null && !payment.getProvider().isBlank()
            && payment.getProviderPaymentId() != null && !payment.getProviderPaymentId().isBlank()) {

            PaymentGateway gateway = paymentGatewayFactory.get(payment.getProvider());

            PaymentGatewayRefundResponse gwRes = gateway.refund(
                PaymentGatewayRefundRequest.builder()
                    .paymentId(payment.getPaymentId())
                    .userId(payment.getUserId())
                    .providerPaymentId(payment.getProviderPaymentId())
                    .refundPrice(request.getRefundPrice())
                    .refundReason(request.getRefundReason())
                    .build()
            );

            if (!gwRes.isSuccess()) {
                throw new IllegalStateException(payment.getProvider() + " refund failed");
            }
        }

        // 3) mark refund done
        refund.markDone(LocalDateTime.now());
        paymentRefundRepository.save(refund);

        // 4) mark payment canceled
        payment.markCanceled();
        paymentRepository.save(payment);

        return PaymentRefundResponse.builder()
            .paymentId(payment.getPaymentId())
            .refundId(refund.getRefundId())
            .paymentSt(ST_DONE)
            .build();
    }
}
