package org.myweb.uniplace.domain.ai.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

@Getter
public class AiAgentRagSearchRequest {

    private String userId;
    private String userSegment;
    private String query;
    private String topic;
    private String keyword;

    public AiIntent getIntent() {
        return AiIntent.AI_AGENT_RAG_SEARCH;
    }
}
