package org.myweb.uniplace.domain.payment.application;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.myweb.uniplace.domain.payment.domain.entity.PaymentAttempt;
import org.myweb.uniplace.domain.payment.repository.PaymentAttemptRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentAttemptServiceImpl implements PaymentAttemptService {

    private final PaymentAttemptRepository paymentAttemptRepository;

    @Override
    public void recordSuccess(Integer paymentId) {

        PaymentAttempt attempt = PaymentAttempt.builder()
                .paymentId(paymentId)
                .attemptStatus("approved")
                .finishedAt(LocalDateTime.now())
                .build();

        paymentAttemptRepository.save(attempt);
    }

    @Override
    public void recordFail(Integer paymentId) {

        PaymentAttempt attempt = PaymentAttempt.builder()
                .paymentId(paymentId)
                .attemptStatus("failed")
                .finishedAt(LocalDateTime.now())
                .build();

        paymentAttemptRepository.save(attempt);
    }
}