package org.myweb.uniplace.domain.ai.application.usecase;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.springframework.stereotype.Component;

@Component
public class PaymentOrderFormCreateUseCase extends AbstractForwardUseCase {

    public PaymentOrderFormCreateUseCase(AiGateway aiGateway) {
        super(aiGateway);
    }

    @Override
    protected AiIntent getIntent() {
        return AiIntent.PAYMENT_ORDER_FORM_CREATE;
    }
}
