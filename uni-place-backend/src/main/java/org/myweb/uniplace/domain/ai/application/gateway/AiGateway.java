package org.myweb.uniplace.domain.ai.application.gateway;

import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;

public interface AiGateway {

    AiGatewayResponse execute(AiGatewayRequest request);
}
