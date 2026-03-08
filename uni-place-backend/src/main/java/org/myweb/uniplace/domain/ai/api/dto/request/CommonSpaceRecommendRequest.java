package org.myweb.uniplace.domain.ai.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

@Getter
public class CommonSpaceRecommendRequest {

    private String userId;
    private Integer spaceId;
    private Integer buildingId;
    private String srStartAt;
    private String srEndAt;
    private String usagePattern;

    public AiIntent getIntent() {
        return AiIntent.COMMON_SPACE_RECOMMEND;
    }
}
