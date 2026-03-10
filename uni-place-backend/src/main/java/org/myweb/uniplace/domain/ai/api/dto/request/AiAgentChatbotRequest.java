package org.myweb.uniplace.domain.ai.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

@Getter
public class AiAgentChatbotRequest {

    private String userId;
    private String userSegment;
    private String prompt;
    private String topic;
    private String keyword;

    public AiIntent getIntent() {
        return AiIntent.AI_AGENT_CHATBOT;
    }
}
