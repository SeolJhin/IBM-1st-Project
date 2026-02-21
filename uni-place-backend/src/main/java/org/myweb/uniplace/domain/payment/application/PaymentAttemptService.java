package org.myweb.uniplace.domain.payment.application;

import org.myweb.uniplace.domain.payment.domain.entity.PaymentAttempt;

public interface PaymentAttemptService {
    void recordAttemptSt(Integer paymentId, PaymentAttempt.AttemptSt attemptSt);
}