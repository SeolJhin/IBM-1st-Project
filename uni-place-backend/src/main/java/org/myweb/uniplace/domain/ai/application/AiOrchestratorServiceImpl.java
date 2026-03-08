package org.myweb.uniplace.domain.ai.application;

import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.springframework.stereotype.Service;

@Service
public class AiOrchestratorServiceImpl implements AiOrchestratorService {

    private final AiIntentRouter aiIntentRouter;

    public AiOrchestratorServiceImpl(AiIntentRouter aiIntentRouter) {
        this.aiIntentRouter = aiIntentRouter;
    }

    @Override
    public AiGatewayResponse handle(AiGatewayRequest request) {
        return aiIntentRouter.route(request);
    }
}
