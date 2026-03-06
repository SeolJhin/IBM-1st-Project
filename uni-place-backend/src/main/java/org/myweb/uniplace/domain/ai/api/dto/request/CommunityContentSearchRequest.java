package org.myweb.uniplace.domain.ai.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

@Getter
public class CommunityContentSearchRequest {

    private String userId;
    private String topic;
    private String keyword;
    private String sort;
    private Integer boardId;
    private String userSegment;

    public AiIntent getIntent() {
        return AiIntent.COMMUNITY_CONTENT_SEARCH;
    }
}
