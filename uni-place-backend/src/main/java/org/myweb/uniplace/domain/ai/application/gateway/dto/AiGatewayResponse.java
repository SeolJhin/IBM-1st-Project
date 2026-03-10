package org.myweb.uniplace.domain.ai.application.gateway.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiGatewayResponse {

    private String answer;
    private Double confidence;
    private Map<String, Object> metadata;
}