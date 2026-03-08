package org.myweb.uniplace.domain.ai.application.usecase;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

public abstract class AbstractForwardUseCase implements AiUseCase {

    private final AiGateway aiGateway;

    protected AbstractForwardUseCase(AiGateway aiGateway) {
        this.aiGateway = aiGateway;
    }

    @Override
    public boolean supports(AiIntent intent) {
        return intent == getIntent();
    }

    @Override
    public AiGatewayResponse execute(AiGatewayRequest request) {
        return aiGateway.execute(request);
    }

    protected abstract AiIntent getIntent();
}
