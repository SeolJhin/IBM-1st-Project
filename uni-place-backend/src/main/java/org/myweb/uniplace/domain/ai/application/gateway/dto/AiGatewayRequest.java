package org.myweb.uniplace.domain.ai.application.gateway.dto;

import java.util.Map;

import org.myweb.uniplace.domain.ai.domain.AiIntent;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiGatewayRequest {

    private AiIntent intent;
    private String userId;
    private String userSegment;
    private Map<String, Object> slots;
    private String prompt;
}
