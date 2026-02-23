package org.myweb.uniplace.domain.payment.application;

public interface PaymentWebhookService {

    void handleKakaoWebhook(String payload);

    void handleTossWebhook(String payload);
}
