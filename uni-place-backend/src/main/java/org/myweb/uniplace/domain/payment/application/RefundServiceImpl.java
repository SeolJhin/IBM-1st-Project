package org.myweb.uniplace.domain.payment.application;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentRefund;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.myweb.uniplace.domain.payment.repository.PaymentRefundRepository;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentRefundRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentRefundResponse;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class RefundServiceImpl implements RefundService {

    private final PaymentRepository paymentRepository;
    private final PaymentRefundRepository paymentRefundRepository;

    @Override
    public PaymentRefundResponse refund(PaymentRefundRequest request) {

        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        PaymentRefund refund = PaymentRefund.builder()
                .paymentId(payment.getPaymentId())
                .refundPrice(request.getRefundAmount())
                .refundStatus("requested")
                .refundReason(request.getReason())
                .build();

        paymentRefundRepository.save(refund);

        refund.markDone(LocalDateTime.now());
        paymentRefundRepository.save(refund);

        payment.markCanceled(LocalDateTime.now());
        paymentRepository.save(payment);

        return PaymentRefundResponse.builder()
                .paymentId(payment.getPaymentId())
                .refundId(refund.getRefundId())
                .status("done")
                .build();
    }
}