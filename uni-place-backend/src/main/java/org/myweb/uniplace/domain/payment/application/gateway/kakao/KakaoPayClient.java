package org.myweb.uniplace.domain.payment.application.gateway.kakao;

import org.myweb.uniplace.domain.payment.application.gateway.exception.PaymentGatewayException;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoApproveRequest;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoApproveResponse;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoCancelRequest;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoCancelResponse;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoReadyRequest;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoReadyResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
public class KakaoPayClient {

    private final KakaoPayProperties props;
    private final WebClient webClient;

    @SuppressWarnings("null")
    public KakaoPayClient(KakaoPayProperties props) {
        this.props = props;
        this.webClient = WebClient.builder()
            .baseUrl(props.getBase_url())
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader(HttpHeaders.AUTHORIZATION, "SECRET_KEY " + props.getSecret_key())
            .build();
    }

    public KakaoReadyResponse ready(@NonNull KakaoReadyRequest request) {
        try {
            return webClient.post()
                .uri("/online/v1/payment/ready")
                .bodyValue(request)
                .retrieve()
                .onStatus(
                    status -> status.isError(),
                    res -> res.bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .flatMap(body -> Mono.error(
                            new PaymentGatewayException("KAKAO", String.valueOf(res.statusCode().value()),
                                "kakao ready http error", body)
                        ))
                )
                .bodyToMono(KakaoReadyResponse.class)
                .block();
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("KAKAO", "kakao ready failed", e);
        }
    }

    public KakaoApproveResponse approve(@NonNull KakaoApproveRequest request) {
        try {
            return webClient.post()
                .uri("/online/v1/payment/approve")
                .bodyValue(request)
                .retrieve()
                .onStatus(
                    status -> status.isError(),
                    res -> res.bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .flatMap(body -> Mono.error(
                            new PaymentGatewayException("KAKAO", String.valueOf(res.statusCode().value()),
                                "kakao approve http error", body)
                        ))
                )
                .bodyToMono(KakaoApproveResponse.class)
                .block();
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("KAKAO", "kakao approve failed", e);
        }
    }

    public KakaoCancelResponse cancel(@NonNull KakaoCancelRequest request) {
        try {
            return webClient.post()
                .uri("/online/v1/payment/cancel")
                .bodyValue(request)
                .retrieve()
                .onStatus(
                    status -> status.isError(),
                    res -> res.bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .flatMap(body -> Mono.error(
                            new PaymentGatewayException("KAKAO", String.valueOf(res.statusCode().value()),
                                "kakao cancel http error", body)
                        ))
                )
                .bodyToMono(KakaoCancelResponse.class)
                .block();
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("KAKAO", "kakao cancel failed", e);
        }
    }
}
