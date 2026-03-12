package org.myweb.uniplace.domain.ai.application.usecase;

import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class AiAgentChatbotUseCase extends AbstractForwardUseCase {

    public AiAgentChatbotUseCase(AiGateway aiGateway) {
        super(aiGateway);
    }

    @Override
    public AiGatewayResponse execute(AiGatewayRequest request) {
        // ✅ SecurityContext에서 userId 직접 추출 — 클라이언트 전달값 보정
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String serverUserId = (auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getName()))
                ? auth.getName()
                : null;

        AiGatewayRequest finalRequest = request;

        if (serverUserId != null && (request.getUserId() == null || request.getUserId().isBlank())) {
            // slots에도 userId 주입 (Python fallback 경로 포함)
            Map<String, Object> slots = request.getSlots() != null
                    ? new HashMap<>(request.getSlots())
                    : new HashMap<>();
            slots.put("userId", serverUserId);

            finalRequest = AiGatewayRequest.builder()
                    .intent(request.getIntent())
                    .userId(serverUserId)
                    .userSegment(request.getUserSegment())
                    .prompt(request.getPrompt())
                    .slots(slots)
                    .build();

            log.info("[AiAgentChatbotUseCase] userId injected from SecurityContext: {}", serverUserId);
        }

        log.info("[AiAgentChatbotUseCase] forwarding to tool_orchestrator, prompt={} userId={}",
            finalRequest.getPrompt() != null
                ? finalRequest.getPrompt().substring(0, Math.min(80, finalRequest.getPrompt().length()))
                : "",
            finalRequest.getUserId());

        return super.execute(finalRequest);
    }

    @Override
    protected AiIntent getIntent() {
        return AiIntent.AI_AGENT_CHATBOT;
    }
}