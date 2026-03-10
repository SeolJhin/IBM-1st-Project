package org.myweb.uniplace.domain.ai.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

@Getter
public class CommunityContentModerationRequest {

    private String userId;
    private String authorId;
    private Integer boardId;
    private String content;

    public AiIntent getIntent() {
        return AiIntent.COMMUNITY_CONTENT_MODERATION;
    }
}
