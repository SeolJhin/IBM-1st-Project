package org.myweb.uniplace.domain.ai.application.gateway;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ai.fastapi")
public class AiGatewayProperties {

    private String baseUrl = "http://localhost:8000";
    private String executePath = "/api/v1/ai/execute";
    private int connectTimeoutMillis = 3000;
    private int readTimeoutSeconds = 30;
}
