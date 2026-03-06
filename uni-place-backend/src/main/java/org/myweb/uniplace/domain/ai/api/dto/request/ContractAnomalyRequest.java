package org.myweb.uniplace.domain.ai.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

@Getter
public class ContractAnomalyRequest {

    private String userId;
    private Integer contractCount;
    private String contractSt;
    private String createdAt;
    private Double patternScore;

    public AiIntent getIntent() {
        return AiIntent.CONTRACT_ANOMALY_DETECTION;
    }
}
