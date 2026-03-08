package org.myweb.uniplace.domain.ai.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;

@Getter
@Builder
public class RoomSearchResponse {

    private String message;
    private Double confidence;

    public static RoomSearchResponse from(AiGatewayResponse response) {
        if (response == null) {
            return RoomSearchResponse.builder().build();
        }
        return RoomSearchResponse.builder()
            .message(response.getAnswer())
            .confidence(response.getConfidence())
            .build();
    }
}
