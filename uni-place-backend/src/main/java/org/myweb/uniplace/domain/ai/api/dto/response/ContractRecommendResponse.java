package org.myweb.uniplace.domain.ai.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;

@Getter
@Builder
public class ContractRecommendResponse {

    private String message;
    private Double confidence;

    public static ContractRecommendResponse from(AiGatewayResponse response) {
        if (response == null) {
            return ContractRecommendResponse.builder().build();
        }
        return ContractRecommendResponse.builder()
            .message(response.getAnswer())
            .confidence(response.getConfidence())
            .build();
    }
}
