package org.myweb.uniplace.domain.payment.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentRefundRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentRefundResponse;
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

    private static final String ST_DONE = "done";

    @Override
    public PaymentRefundResponse refund(PaymentRefundRequest request) {

        Payment payment = paymentRepository.findById(request.getPaymentId())
            .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        // 1) 환불 레코드 생성 (requested)
        PaymentRefund refund = PaymentRefund.builder()
            .paymentId(payment.getPaymentId())
            .refundPrice(request.getRefundPrice())   
            .refundSt(PaymentRefund.RefundSt.requested)
            .refundReason(request.getRefundReason())
            .build();

        paymentRefundRepository.save(refund);

        // 2) 실제 환불 성공 처리(현재는 즉시 done 처리)
        refund.markDone(LocalDateTime.now());
        paymentRefundRepository.save(refund);

        // 3) 결제 상태 취소로 변경
        payment.markCanceled(); // ✅ 파라미터 없음
        paymentRepository.save(payment);

        return PaymentRefundResponse.builder()
            .paymentId(payment.getPaymentId())
            .refundId(refund.getRefundId())
            .paymentSt(ST_DONE)
            .build();
    }
}