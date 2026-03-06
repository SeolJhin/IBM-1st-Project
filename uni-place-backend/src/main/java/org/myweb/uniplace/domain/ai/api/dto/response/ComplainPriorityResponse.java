package org.myweb.uniplace.domain.ai.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;

@Getter
@Builder
public class ComplainPriorityResponse {

    private String message;
    private Double priorityScore;

    public static ComplainPriorityResponse from(AiGatewayResponse response) {
        if (response == null) {
            return ComplainPriorityResponse.builder().build();
        }
        Double score = response.getConfidence();
        return ComplainPriorityResponse.builder()
            .message(response.getAnswer())
            .priorityScore(score)
            .build();
    }
}
