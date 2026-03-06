package org.myweb.uniplace.global.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import java.util.concurrent.TimeUnit;
import org.myweb.uniplace.domain.ai.application.gateway.AiGatewayProperties;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

@Configuration
@EnableConfigurationProperties(AiGatewayProperties.class)
public class AiClientConfig {

    @Bean
    @Qualifier("aiWebClient")
    public WebClient aiWebClient(AiGatewayProperties properties) {
        HttpClient httpClient = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, properties.getConnectTimeoutMillis())
            .doOnConnected(conn -> conn.addHandlerLast(
                new ReadTimeoutHandler(properties.getReadTimeoutSeconds(), TimeUnit.SECONDS)
            ));

        return WebClient.builder()
            .baseUrl(properties.getBaseUrl())
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
    }
}
