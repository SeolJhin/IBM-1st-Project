package org.myweb.uniplace.domain.payment.application.gateway.naver;

import java.time.Duration;
import java.util.Optional;

import org.myweb.uniplace.domain.payment.application.gateway.exception.PaymentGatewayException;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverApproveRequest;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverApproveResponse;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverCancelRequest;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverCancelResponse;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverReadyRequest;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverReadyResponse;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

@Component
public class NaverPayClient {

    private final NaverPayProperties props;
    private final WebClient webClient;
    private final WebClient cancelClient;

    @SuppressWarnings("null")
    public NaverPayClient(NaverPayProperties props) {
        this.props = props;
        HttpClient httpClient = HttpClient.create()
            .responseTimeout(Duration.ofSeconds(60));

        WebClient.Builder builder = WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .baseUrl(buildBaseUrl(props))
            .defaultHeader("X-Naver-Client-Id", nvl(props.getClient_id()))
            .defaultHeader("X-Naver-Client-Secret", nvl(props.getClient_secret()));

        Optional.ofNullable(props.getChain_id())
            .filter(v -> !v.isBlank())
            .ifPresent(v -> builder.defaultHeader("X-NaverPay-Chain-Id", v));

        this.webClient = builder.build();

        WebClient.Builder cancelBuilder = WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .baseUrl(buildCancelBaseUrl(props))
            .defaultHeader("X-Naver-Client-Id", nvl(props.getClient_id()))
            .defaultHeader("X-Naver-Client-Secret", nvl(props.getClient_secret()));

        Optional.ofNullable(props.getChain_id())
            .filter(v -> !v.isBlank())
            .ifPresent(v -> cancelBuilder.defaultHeader("X-NaverPay-Chain-Id", v));

        this.cancelClient = cancelBuilder.build();
    }

    public NaverReadyResponse reserve(@NonNull NaverReadyRequest request) {
        try {
            return webClient.post()
                .uri("/reserve")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .onStatus(
                    status -> status.isError(),
                    res -> res.bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .flatMap(body -> Mono.error(
                            new PaymentGatewayException("NAVER", String.valueOf(res.statusCode().value()),
                                "naver reserve http error", body)
                        ))
                )
                .bodyToMono(NaverReadyResponse.class)
                .block();
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

            WebClient.RequestHeadersSpec<?> req = webClient.post()
                .uri("/apply/payment")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(form);

            Optional.ofNullable(request.getIdempotencyKey())
                .filter(v -> !v.isBlank())
                .ifPresent(v -> req.header("X-NaverPay-Idempotency-Key", v));

            return req.retrieve()
                .onStatus(
                    status -> status.isError(),
                    res -> res.bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .flatMap(body -> Mono.error(
                            new PaymentGatewayException("NAVER", String.valueOf(res.statusCode().value()),
                                "naver approve http error", body)
                        ))
                )
                .bodyToMono(NaverApproveResponse.class)
                .block();
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

            WebClient.RequestHeadersSpec<?> req = cancelClient.post()
                .uri("/cancel")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(form);

            Optional.ofNullable(request.getIdempotencyKey())
                .filter(v -> !v.isBlank())
                .ifPresent(v -> req.header("X-NaverPay-Idempotency-Key", v));

            return req.retrieve()
                .onStatus(
                    status -> status.isError(),
                    res -> res.bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .flatMap(body -> Mono.error(
                            new PaymentGatewayException("NAVER", String.valueOf(res.statusCode().value()),
                                "naver cancel http error", body)
                        ))
                )
                .bodyToMono(NaverCancelResponse.class)
                .block();
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
