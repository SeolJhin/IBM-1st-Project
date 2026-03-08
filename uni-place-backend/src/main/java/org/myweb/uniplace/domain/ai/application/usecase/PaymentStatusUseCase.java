package org.myweb.uniplace.domain.ai.application.usecase;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.springframework.stereotype.Component;

@Component
public class PaymentStatusUseCase extends AbstractForwardUseCase {

    public PaymentStatusUseCase(AiGateway aiGateway) {
        super(aiGateway);
    }

    @Override
    protected AiIntent getIntent() {
        return AiIntent.PAYMENT_STATUS_SUMMARY;
    }
}
