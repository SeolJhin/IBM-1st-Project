package org.myweb.uniplace.domain.ai.api.dto.response;

import java.util.Map;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;

@Getter
@Builder
public class AiChatResponse {

    private String answer;
    private Double confidence;
    private Map<String, Object> metadata;

    public static AiChatResponse from(AiGatewayResponse response) {
        if (response == null) {
            return AiChatResponse.builder().build();
        }
        return AiChatResponse.builder()
            .answer(response.getAnswer())
            .confidence(response.getConfidence())
            .metadata(response.getMetadata())
            .build();
    }
}
