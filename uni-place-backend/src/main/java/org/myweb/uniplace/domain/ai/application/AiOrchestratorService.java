package org.myweb.uniplace.domain.ai.application;

import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;

public interface AiOrchestratorService {

    AiGatewayResponse handle(AiGatewayRequest request);
}
