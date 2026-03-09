package org.myweb.uniplace.domain.payment.application.gateway.toss;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import com.fasterxml.jackson.databind.JsonNode;
import org.myweb.uniplace.domain.payment.application.gateway.exception.PaymentGatewayException;
import org.myweb.uniplace.domain.payment.application.gateway.toss.dto.TossApproveRequest;
import org.myweb.uniplace.domain.payment.application.gateway.toss.dto.TossApproveResponse;
import org.myweb.uniplace.domain.payment.application.gateway.toss.dto.TossCancelRequest;
import org.myweb.uniplace.domain.payment.application.gateway.toss.dto.TossCancelResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class TossClient {

    private final RestClient restClient;

    @SuppressWarnings("null")
    public TossClient(TossProperties props) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(30000);
        requestFactory.setReadTimeout(60000);

        this.restClient = RestClient.builder()
            .requestFactory(requestFactory)
            .baseUrl(props.getApi_base_url())
            .defaultHeader(HttpHeaders.AUTHORIZATION, buildBasicAuth(props.getSecret_key()))
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    public TossApproveResponse confirm(@NonNull TossApproveRequest request) {
        try {
            TossApproveResponse response = restClient.post()
                .uri("/v1/payments/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    String body = "";
                    try {
                        body = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    } catch (IOException ignored) {
                        body = "";
                    }
                    throw new PaymentGatewayException(
                        "TOSS",
                        String.valueOf(res.getStatusCode().value()),
                        "toss confirm http error",
                        body
                    );
                })
                .body(TossApproveResponse.class);
            if (response == null) {
                throw new PaymentGatewayException("TOSS", "toss confirm empty response", null);
            }
            return response;
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("TOSS", "toss confirm failed", e);
        }
    }

    public TossCancelResponse cancel(@NonNull String paymentKey, @NonNull TossCancelRequest request) {
        try {
            TossCancelResponse response = restClient.post()
                .uri("/v1/payments/{paymentKey}/cancel", paymentKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    String body = "";
                    try {
                        body = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    } catch (IOException ignored) {
                        body = "";
                    }
                    throw new PaymentGatewayException(
                        "TOSS",
                        String.valueOf(res.getStatusCode().value()),
                        "toss cancel http error",
                        body
                    );
                })
                .body(TossCancelResponse.class);
            if (response == null) {
                throw new PaymentGatewayException("TOSS", "toss cancel empty response", null);
            }
            return response;
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("TOSS", "toss cancel failed", e);
        }
    }

    public JsonNode getByPaymentKey(@NonNull String paymentKey) {
        try {
            JsonNode response = restClient.get()
                .uri("/v1/payments/{paymentKey}", paymentKey)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    String body = "";
                    try {
                        body = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    } catch (IOException ignored) {
                        body = "";
                    }
                    throw new PaymentGatewayException(
                        "TOSS",
                        String.valueOf(res.getStatusCode().value()),
                        "toss get by paymentKey http error",
                        body
                    );
                })
                .body(JsonNode.class);
            if (response == null) {
                throw new PaymentGatewayException("TOSS", "toss get by paymentKey empty response", null);
            }
            return response;
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("TOSS", "toss get by paymentKey failed", e);
        }
    }

    public JsonNode getByOrderId(@NonNull String orderId) {
        try {
            JsonNode response = restClient.get()
                .uri("/v1/payments/orders/{orderId}", orderId)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    String body = "";
                    try {
                        body = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    } catch (IOException ignored) {
                        body = "";
                    }
                    throw new PaymentGatewayException(
                        "TOSS",
                        String.valueOf(res.getStatusCode().value()),
                        "toss get by orderId http error",
                        body
                    );
                })
                .body(JsonNode.class);
            if (response == null) {
                throw new PaymentGatewayException("TOSS", "toss get by orderId empty response", null);
            }
            return response;
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
