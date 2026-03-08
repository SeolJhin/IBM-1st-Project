package org.myweb.uniplace.domain.ai.application.usecase;

import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

public interface AiUseCase {

    boolean supports(AiIntent intent);

    AiGatewayResponse execute(AiGatewayRequest request);
}
