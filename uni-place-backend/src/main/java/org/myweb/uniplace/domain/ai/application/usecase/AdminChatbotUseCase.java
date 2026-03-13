package org.myweb.uniplace.domain.ai.application.usecase;

import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AdminChatbotUseCase extends AbstractForwardUseCase {

    public AdminChatbotUseCase(AiGateway aiGateway) {
        super(aiGateway);
    }

    @Override
    public AiGatewayResponse execute(AiGatewayRequest request) {
        log.info("[AdminChatbotUseCase] forwarding to admin_tool_orchestrator, prompt={} adminId={}",
            request.getPrompt() != null
                ? request.getPrompt().substring(0, Math.min(80, request.getPrompt().length()))
                : "",
            request.getUserId());

        return super.execute(request);
    }

    @Override
    protected AiIntent getIntent() {
        return AiIntent.ADMIN_CHATBOT;
    }
}