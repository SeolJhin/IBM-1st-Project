package org.myweb.uniplace.domain.payment.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.payment.domain.entity.PaymentAttempt;
import org.myweb.uniplace.domain.payment.repository.PaymentAttemptRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentAttemptServiceImpl implements PaymentAttemptService {

    private final PaymentAttemptRepository paymentAttemptRepository;

    @Override
    public void recordAttemptSt(Integer paymentId, PaymentAttempt.AttemptSt attemptSt) {
        PaymentAttempt attempt = PaymentAttempt.builder()
            .paymentId(paymentId)
            .attemptSt(attemptSt)
            .finishedAt(LocalDateTime.now())
            .build();

        paymentAttemptRepository.save(attempt);
    }
}