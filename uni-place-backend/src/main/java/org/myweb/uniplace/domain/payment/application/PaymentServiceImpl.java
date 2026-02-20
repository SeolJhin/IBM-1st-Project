package org.myweb.uniplace.domain.payment.application;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import org.myweb.uniplace.domain.payment.api.dto.request.PaymentApproveRequest;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentPrepareRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentPrepareResponse;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentResponse;
import org.myweb.uniplace.domain.payment.domain.entity.Payment;
import org.myweb.uniplace.domain.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;

    @Override
    public PaymentPrepareResponse prepare(PaymentPrepareRequest request) {

        String merchantUid = UUID.randomUUID().toString();

        Payment payment = Payment.builder()
                .userId(request.getUserId())
                .serviceGoodsId(request.getServiceGoodsId())
                .currency("KRW")
                .amountTotal(request.getAmount())
                .amountCaptured(BigDecimal.ZERO)
                .amountRefunded(BigDecimal.ZERO)
                .provider(request.getProvider())
                .merchantUid(merchantUid)
                .paymentStatus("ready")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        paymentRepository.save(payment);

        return PaymentPrepareResponse.builder()
                .paymentId(payment.getPaymentId())
                .merchantUid(merchantUid)
                .status("ready")
                .build();
    }

    @Override
    public PaymentResponse approve(PaymentApproveRequest request) {

        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        payment.markPaid(LocalDateTime.now());
        paymentRepository.save(payment);

        return PaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .status("paid")
                .paidAt(payment.getPaidAt())
                .build();
    }

    @Override
    public PaymentResponse retry(Integer paymentId) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        payment.markFailed("RETRY", "Retry requested");
        paymentRepository.save(payment);

        return PaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .status(payment.getPaymentStatus())
                .build();
    }
}