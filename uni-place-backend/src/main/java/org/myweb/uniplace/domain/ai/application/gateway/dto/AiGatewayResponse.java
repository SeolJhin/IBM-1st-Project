package org.myweb.uniplace.domain.ai.application.gateway.dto;

import java.util.Map;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiGatewayResponse {

    private String answer;
    private Double confidence;
    private Map<String, Object> metadata;
}
