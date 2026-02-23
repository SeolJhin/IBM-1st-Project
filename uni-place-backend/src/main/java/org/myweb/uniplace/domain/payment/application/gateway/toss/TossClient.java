package org.myweb.uniplace.domain.payment.application.gateway.toss;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

import com.fasterxml.jackson.databind.JsonNode;
import org.myweb.uniplace.domain.payment.application.gateway.exception.PaymentGatewayException;
import org.myweb.uniplace.domain.payment.application.gateway.toss.dto.TossApproveRequest;
import org.myweb.uniplace.domain.payment.application.gateway.toss.dto.TossApproveResponse;
import org.myweb.uniplace.domain.payment.application.gateway.toss.dto.TossCancelRequest;
import org.myweb.uniplace.domain.payment.application.gateway.toss.dto.TossCancelResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

@Component
public class TossClient {

    private final WebClient webClient;

    @SuppressWarnings("null")
    public TossClient(TossProperties props) {
        HttpClient httpClient = HttpClient.create()
            .responseTimeout(Duration.ofSeconds(60));

        this.webClient = WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .baseUrl(props.getApi_base_url())
            .defaultHeader(HttpHeaders.AUTHORIZATION, buildBasicAuth(props.getSecret_key()))
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    public TossApproveResponse confirm(@NonNull TossApproveRequest request) {
        try {
            return webClient.post()
                .uri("/v1/payments/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .onStatus(
                    status -> status.isError(),
                    res -> res.bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .flatMap(body -> Mono.error(
                            new PaymentGatewayException("TOSS", String.valueOf(res.statusCode().value()),
                                "toss confirm http error", body)
                        ))
                )
                .bodyToMono(TossApproveResponse.class)
                .block();
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("TOSS", "toss confirm failed", e);
        }
    }

    public TossCancelResponse cancel(@NonNull String paymentKey, @NonNull TossCancelRequest request) {
        try {
            return webClient.post()
                .uri("/v1/payments/{paymentKey}/cancel", paymentKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .onStatus(
                    status -> status.isError(),
                    res -> res.bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .flatMap(body -> Mono.error(
                            new PaymentGatewayException("TOSS", String.valueOf(res.statusCode().value()),
                                "toss cancel http error", body)
                        ))
                )
                .bodyToMono(TossCancelResponse.class)
                .block();
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("TOSS", "toss cancel failed", e);
        }
    }

    public JsonNode getByPaymentKey(@NonNull String paymentKey) {
        try {
            return webClient.get()
                .uri("/v1/payments/{paymentKey}", paymentKey)
                .retrieve()
                .onStatus(
                    status -> status.isError(),
                    res -> res.bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .flatMap(body -> Mono.error(
                            new PaymentGatewayException("TOSS", String.valueOf(res.statusCode().value()),
                                "toss get by paymentKey http error", body)
                        ))
                )
                .bodyToMono(JsonNode.class)
                .block();
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("TOSS", "toss get by paymentKey failed", e);
        }
    }

    public JsonNode getByOrderId(@NonNull String orderId) {
        try {
            return webClient.get()
                .uri("/v1/payments/orders/{orderId}", orderId)
                .retrieve()
                .onStatus(
                    status -> status.isError(),
                    res -> res.bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .flatMap(body -> Mono.error(
                            new PaymentGatewayException("TOSS", String.valueOf(res.statusCode().value()),
                                "toss get by orderId http error", body)
                        ))
                )
                .bodyToMono(JsonNode.class)
                .block();
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("TOSS", "toss get by orderId failed", e);
        }
    }

    private static String buildBasicAuth(String secretKey) {
        String raw = (secretKey == null ? "" : secretKey) + ":";
        return "Basic " + Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }
}
