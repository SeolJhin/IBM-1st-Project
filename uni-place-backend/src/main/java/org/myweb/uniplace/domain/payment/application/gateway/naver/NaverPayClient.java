package org.myweb.uniplace.domain.payment.application.gateway.naver;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import org.myweb.uniplace.domain.payment.application.gateway.exception.PaymentGatewayException;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverApproveRequest;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverApproveResponse;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverCancelRequest;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverCancelResponse;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverReadyRequest;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverReadyResponse;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.lang.NonNull;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Component
@Lazy
public class NaverPayClient {

    private final NaverPayProperties props;
    private final RestClient restClient;
    private final RestClient cancelRestClient;

    @SuppressWarnings("null")
    public NaverPayClient(NaverPayProperties props) {
        this.props = props;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(30000);
        requestFactory.setReadTimeout(60000);

        RestClient.Builder builder = RestClient.builder()
            .requestFactory(requestFactory)
            .baseUrl(buildBaseUrl(props))
            .defaultHeader("X-Naver-Client-Id", nvl(props.getClient_id()))
            .defaultHeader("X-Naver-Client-Secret", nvl(props.getClient_secret()));

        Optional.ofNullable(props.getChain_id())
            .filter(v -> !v.isBlank())
            .ifPresent(v -> builder.defaultHeader("X-NaverPay-Chain-Id", v));

        this.restClient = builder.build();

        RestClient.Builder cancelBuilder = RestClient.builder()
            .requestFactory(requestFactory)
            .baseUrl(buildCancelBaseUrl(props))
            .defaultHeader("X-Naver-Client-Id", nvl(props.getClient_id()))
            .defaultHeader("X-Naver-Client-Secret", nvl(props.getClient_secret()));

        Optional.ofNullable(props.getChain_id())
            .filter(v -> !v.isBlank())
            .ifPresent(v -> cancelBuilder.defaultHeader("X-NaverPay-Chain-Id", v));

        this.cancelRestClient = cancelBuilder.build();
    }

    public NaverReadyResponse reserve(@NonNull NaverReadyRequest request) {
        try {
            NaverReadyResponse response = restClient.post()
                .uri("/reserve")
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
                        "NAVER",
                        String.valueOf(res.getStatusCode().value()),
                        "naver reserve http error",
                        body
                    );
                })
                .body(NaverReadyResponse.class);
            if (response == null) {
                throw new PaymentGatewayException("NAVER", "naver reserve empty response", null);
            }
            return response;
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("NAVER", "naver reserve failed", e);
        }
    }

    public NaverApproveResponse approve(@NonNull NaverApproveRequest request) {
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("paymentId", request.getPaymentId());

            RestClient.RequestBodySpec req = restClient.post()
                .uri("/apply/payment")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED);

            Optional.ofNullable(request.getIdempotencyKey())
                .filter(v -> !v.isBlank())
                .ifPresent(v -> req.header("X-NaverPay-Idempotency-Key", v));

            NaverApproveResponse response = req.body(form)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (requestHeader, res) -> {
                    String body = "";
                    try {
                        body = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    } catch (IOException ignored) {
                        body = "";
                    }
                    throw new PaymentGatewayException(
                        "NAVER",
                        String.valueOf(res.getStatusCode().value()),
                        "naver approve http error",
                        body
                    );
                })
                .body(NaverApproveResponse.class);
            if (response == null) {
                throw new PaymentGatewayException("NAVER", "naver approve empty response", null);
            }
            return response;
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("NAVER", "naver approve failed", e);
        }
    }

    public NaverCancelResponse cancel(@NonNull NaverCancelRequest request) {
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("paymentId", request.getPaymentId());
            form.add("cancelAmount", String.valueOf(request.getCancelAmount()));
            form.add("cancelReason", request.getCancelReason());
            form.add("cancelRequester", request.getCancelRequester());
            form.add("taxScopeAmount", String.valueOf(request.getTaxScopeAmount()));
            form.add("taxExScopeAmount", String.valueOf(request.getTaxExScopeAmount()));

            if (request.getMerchantPayTransactionKey() != null && !request.getMerchantPayTransactionKey().isBlank()) {
                form.add("merchantPayTransactionKey", request.getMerchantPayTransactionKey());
            }
            if (request.getEnvironmentDepositAmount() != null) {
                form.add("environmentDepositAmount", String.valueOf(request.getEnvironmentDepositAmount()));
            }
            if (request.getDoCompareRest() != null) {
                form.add("doCompareRest", String.valueOf(request.getDoCompareRest()));
            }
            if (request.getExpectedRestAmount() != null) {
                form.add("expectedRestAmount", String.valueOf(request.getExpectedRestAmount()));
            }

            RestClient.RequestBodySpec req = cancelRestClient.post()
                .uri("/cancel")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED);

            Optional.ofNullable(request.getIdempotencyKey())
                .filter(v -> !v.isBlank())
                .ifPresent(v -> req.header("X-NaverPay-Idempotency-Key", v));

            NaverCancelResponse response = req.body(form)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (requestHeader, res) -> {
                    String body = "";
                    try {
                        body = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    } catch (IOException ignored) {
                        body = "";
                    }
                    throw new PaymentGatewayException(
                        "NAVER",
                        String.valueOf(res.getStatusCode().value()),
                        "naver cancel http error",
                        body
                    );
                })
                .body(NaverCancelResponse.class);
            if (response == null) {
                throw new PaymentGatewayException("NAVER", "naver cancel empty response", null);
            }
            return response;
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("NAVER", "naver cancel failed", e);
        }
    }

    private static String buildBaseUrl(NaverPayProperties props) {
        String base = nvl(props.getApi_base_url());
        String partner = nvl(props.getPartner_id());
        String version = nvl(props.getApi_version());
        return base + "/" + partner + "/naverpay/payments/" + version;
    }

    private static String buildCancelBaseUrl(NaverPayProperties props) {
        String base = nvl(props.getApi_base_url());
        String partner = nvl(props.getPartner_id());
        return base + "/" + partner + "/naverpay/payments/v1";
    }

    private static String nvl(String v) {
        return v == null ? "" : v;
    }
}
