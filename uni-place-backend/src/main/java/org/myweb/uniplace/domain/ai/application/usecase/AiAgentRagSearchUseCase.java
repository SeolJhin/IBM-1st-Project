package org.myweb.uniplace.domain.ai.application.usecase;

import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.springframework.stereotype.Component;

@Component
public class AiAgentRagSearchUseCase extends AbstractForwardUseCase {

    public AiAgentRagSearchUseCase(AiGateway aiGateway) {
        super(aiGateway);
    }

    @Override
    protected AiIntent getIntent() {
        return AiIntent.AI_AGENT_RAG_SEARCH;
    }
}
