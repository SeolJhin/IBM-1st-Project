package org.myweb.uniplace.domain.payment.application.gateway.kakao;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.myweb.uniplace.domain.payment.application.gateway.exception.PaymentGatewayException;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoApproveRequest;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoApproveResponse;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoCancelRequest;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoCancelResponse;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoReadyRequest;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoReadyResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class KakaoPayClient {

    private final KakaoPayProperties props;
    private final RestClient restClient;

    @SuppressWarnings("null")
    public KakaoPayClient(KakaoPayProperties props) {
        this.props = props;
        this.restClient = RestClient.builder()
            .baseUrl(props.getBase_url())
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader(HttpHeaders.AUTHORIZATION, "SECRET_KEY " + props.getSecret_key())
            .build();
    }

    public KakaoReadyResponse ready(@NonNull KakaoReadyRequest request) {
        try {
            KakaoReadyResponse response = restClient.post() // web 방식에서 rest 방식으로 바꿈.
                .uri("/online/v1/payment/ready")
//                .body(request)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    String body = "";
                    try {
                        body = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    } catch (IOException ignored) {
                        body = "";
                    }
                    throw new PaymentGatewayException(
                        "KAKAO",
                        String.valueOf(res.getStatusCode().value()),
                        "kakao ready http error",
                        body
                    );
                })
                .body(KakaoReadyResponse.class);
            if (response == null) {
                throw new PaymentGatewayException("KAKAO", "kakao ready empty response", null);
            }
            return response;
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("KAKAO", "kakao ready failed", e);
        }
    }

    public KakaoApproveResponse approve(@NonNull KakaoApproveRequest request) {
        try {
            KakaoApproveResponse response = restClient.post()
                .uri("/online/v1/payment/approve")
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
                        "KAKAO",
                        String.valueOf(res.getStatusCode().value()),
                        "kakao approve http error",
                        body
                    );
                })
                .body(KakaoApproveResponse.class);
            if (response == null) {
                throw new PaymentGatewayException("KAKAO", "kakao approve empty response", null);
            }
            return response;
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("KAKAO", "kakao approve failed", e);
        }
    }

    public KakaoCancelResponse cancel(@NonNull KakaoCancelRequest request) {
        try {
            KakaoCancelResponse response = restClient.post()
                .uri("/online/v1/payment/cancel")
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
                        "KAKAO",
                        String.valueOf(res.getStatusCode().value()),
                        "kakao cancel http error",
                        body
                    );
                })
                .body(KakaoCancelResponse.class);
            if (response == null) {
                throw new PaymentGatewayException("KAKAO", "kakao cancel empty response", null);
            }
            return response;
        } catch (PaymentGatewayException e) {
            throw e;
        } catch (Exception e) {
            throw new PaymentGatewayException("KAKAO", "kakao cancel failed", e);
        }
    }
}
