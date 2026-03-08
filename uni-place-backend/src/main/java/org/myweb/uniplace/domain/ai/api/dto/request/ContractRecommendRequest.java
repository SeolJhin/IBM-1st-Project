package org.myweb.uniplace.domain.ai.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

@Getter
public class ContractRecommendRequest {

    private String userId;
    private String contractEnd;
    private Integer roomId;
    private Integer rentPrice;
    private Integer buildingId;

    public AiIntent getIntent() {
        return AiIntent.CONTRACT_RENEWAL_RECOMMEND;
    }
}
