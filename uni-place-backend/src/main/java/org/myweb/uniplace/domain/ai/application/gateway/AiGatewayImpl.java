package org.myweb.uniplace.domain.ai.application.gateway;

import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayRequest;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;
import org.myweb.uniplace.domain.ai.exception.AiServiceException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class AiGatewayImpl implements AiGateway {

    private final WebClient webClient;
    private final AiGatewayProperties properties;

    public AiGatewayImpl(@Qualifier("aiWebClient") WebClient webClient, AiGatewayProperties properties) {
        this.webClient = webClient;
        this.properties = properties;
    }

    @Override
    public AiGatewayResponse execute(AiGatewayRequest request) {
        try {
            return webClient.post()
                .uri(properties.getExecutePath())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(AiGatewayResponse.class)
                .block();
        } catch (Exception e) {
            throw new AiServiceException("AI gateway call failed", e);
        }
    }
}
