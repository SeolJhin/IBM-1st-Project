package org.myweb.uniplace.domain.ai.application.usecase;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.springframework.stereotype.Component;

@Component
public class GeneralQaUseCase extends AbstractForwardUseCase {

    public GeneralQaUseCase(AiGateway aiGateway) {
        super(aiGateway);
    }

    @Override
    protected AiIntent getIntent() {
        return AiIntent.GENERAL_QA;
    }
}
