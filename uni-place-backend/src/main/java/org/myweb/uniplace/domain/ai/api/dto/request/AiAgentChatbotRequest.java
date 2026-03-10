// src/main/java/org/myweb/uniplace/domain/ai/api/dto/request/AiAgentChatbotRequest.java
package org.myweb.uniplace.domain.ai.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

import java.util.Map;

@Getter
public class AiAgentChatbotRequest {

    private String userId;
    private String userSegment;
    private String prompt;
    private String intent;       // 프론트에서 분류한 intent 문자열
    private Map<String, Object> slots;

    // intent 문자열 → AiIntent enum 변환 (없으면 GENERAL_QA)
    public AiIntent getIntent() {
        if (intent == null || intent.isBlank()) {
            return AiIntent.AI_AGENT_CHATBOT;
        }
        try {
            return AiIntent.valueOf(intent.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return AiIntent.AI_AGENT_CHATBOT;
        }
    }
}
