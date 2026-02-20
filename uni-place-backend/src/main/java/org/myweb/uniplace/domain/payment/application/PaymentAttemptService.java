package org.myweb.uniplace.domain.payment.application;

public interface PaymentAttemptService {
    void recordSuccess(Integer paymentId);
    void recordFail(Integer paymentId);
}