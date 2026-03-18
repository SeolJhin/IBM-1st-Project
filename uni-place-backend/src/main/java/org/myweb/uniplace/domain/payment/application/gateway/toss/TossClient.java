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
import org.myweb.uniplace.domain.payment.application.gateway.toss.dto.TossReadyRequest;
import org.myweb.uniplace.domain.payment.application.gateway.toss.dto.TossReadyResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class TossClient {

    private final TossProperties props;
    private final RestClient restClient;

    @SuppressWarnings("null")
    public TossClient(TossProperties props) {
        this.props = props;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(30000);
        requestFactory.setReadTimeout(60000);

        this.restClient = RestClient.builder()
            .requestFactory(requestFactory)
            .baseUrl(props.getApi_base_url())
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader("TossPayments-Version", nvl(props.getApi_version(), "2024-06-01"))
            .build();
    }

    public TossReadyResponse create(@NonNull TossReadyRequest request) {
        try {
            TossReadyResponse response = restClient.post()
                .uri("/v1/payments")
                .header(HttpHeaders.AUTHORIZATION, basicAuthHeader())
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
                        "toss create http error",
                        body
                    );
                })
                .body(TossReadyResponse.class);
            if (response == null) {
                throw new PaymentGatewayException("TOSS", "toss create empty response", null);
            }
            return response;
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("TOSS", "toss create failed", e);
        }
    }

    public TossApproveResponse confirm(@NonNull TossApproveRequest request) {
        try {
            TossApproveResponse response = restClient.post()
                .uri("/v1/payments/confirm")
                .header(HttpHeaders.AUTHORIZATION, basicAuthHeader())
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
                .header(HttpHeaders.AUTHORIZATION, basicAuthHeader())
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
                .header(HttpHeaders.AUTHORIZATION, basicAuthHeader())
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
                .header(HttpHeaders.AUTHORIZATION, basicAuthHeader())
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

    private String basicAuthHeader() {
        String secretKey = resolveSecretKey();
        if (secretKey == null || secretKey.isBlank()) {
            throw new PaymentGatewayException("TOSS", "MISSING_SECRET_KEY", "missing toss secret key", null);
        }
        String token = Base64.getEncoder().encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
        return "Basic " + token;
    }

    private String resolveSecretKey() {
        String secretKey = props.getSecret_key();
        if (secretKey != null && !secretKey.isBlank()) {
            return secretKey;
        }
        return props.getApi_key();
    }

    private static String nvl(String value, String defaultValue) {
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        return value;
    }
}
