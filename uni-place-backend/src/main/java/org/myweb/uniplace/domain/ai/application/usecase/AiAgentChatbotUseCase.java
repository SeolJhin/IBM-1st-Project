package org.myweb.uniplace.domain.ai.application.usecase;

import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.ai.application.gateway.AiGateway;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;
import org.springframework.stereotype.Component;

/**
 * AI 챗봇 UseCase — tool_orchestrator에 단순 포워딩.
 *
 * [변경 전]
 *   Step1: Python intent 분류 → Step2: 각 UseCase DB 조회 → Step3: Python 답변 생성
 *
 * [변경 후]
 *   Python tool_orchestrator가 전부 처리:
 *   LLM → SQL 생성 → Spring AiToolController DB 조회 → LLM 최종 답변
 *   Spring은 단순히 /chat/agent-chatbot 으로 포워딩만 합니다.
 */
@Slf4j
@Component
public class AiAgentChatbotUseCase extends AbstractForwardUseCase {

    public AiAgentChatbotUseCase(AiGateway aiGateway) {
        super(aiGateway);
    }

    @Override
    public AiGatewayResponse execute(AiGatewayRequest request) {
        log.info("[AiAgentChatbotUseCase] forwarding to tool_orchestrator, prompt={}",
            request.getPrompt() != null
                ? request.getPrompt().substring(0, Math.min(80, request.getPrompt().length()))
                : "");
        return super.execute(request);
    }

    @Override
    protected AiIntent getIntent() {
        return AiIntent.AI_AGENT_CHATBOT;
    }
}
