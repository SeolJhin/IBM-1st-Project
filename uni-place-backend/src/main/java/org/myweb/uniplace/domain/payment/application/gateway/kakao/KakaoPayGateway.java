package org.myweb.uniplace.domain.payment.application.gateway.kakao;

import java.math.BigDecimal;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;

import org.myweb.uniplace.domain.payment.application.gateway.PaymentGateway;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayApproveRequest;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayApproveResponse;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayReadyRequest;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayReadyResponse;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayRefundRequest;
import org.myweb.uniplace.domain.payment.application.gateway.dto.PaymentGatewayRefundResponse;
import org.myweb.uniplace.domain.payment.application.gateway.exception.PaymentGatewayException;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoApproveRequest;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoApproveResponse;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoCancelRequest;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoCancelResponse;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoReadyRequest;
import org.myweb.uniplace.domain.payment.application.gateway.kakao.dto.KakaoReadyResponse;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class KakaoPayGateway implements PaymentGateway {

    private final KakaoPayProperties props;
    private final KakaoPayClient client;
    private final ObjectMapper objectMapper;

    @Override
    public String provider() {
        return "KAKAO";
    }

    @Override
    public PaymentGatewayReadyResponse ready(PaymentGatewayReadyRequest request) {

        KakaoReadyRequest kakaoReq = KakaoReadyRequest.builder()
            .cid(props.getCid())
            .cid_secret(props.getCid_secret())
            .partner_order_id(request.getOrderId())
            .partner_user_id(request.getUserId())
            .item_name(nvl(request.getItemName(), "uni-place"))
            .quantity(nvl(request.getQuantity(), 1))
            .total_amount(toIntExact(request.getTotalPrice(), "totalPrice"))
            .tax_free_amount(toIntExact(nvl(request.getTaxFreePrice(), BigDecimal.ZERO), "taxFreePrice"))
            .approval_url(request.getApprovalUrl())
            .cancel_url(request.getCancelUrl())
            .fail_url(request.getFailUrl())
            .build();

        KakaoReadyResponse kakaoRes = client.ready(kakaoReq);

        return PaymentGatewayReadyResponse.builder()
            .providerRefId(kakaoRes.getTid())
            .redirectAppUrl(kakaoRes.getNext_redirect_app_url())
            .redirectMobileUrl(kakaoRes.getNext_redirect_mobile_url())
            .redirectPcUrl(kakaoRes.getNext_redirect_pc_url())
            .pgReadyJson(toJson(kakaoRes))
            .build();
    }

    @Override
    public PaymentGatewayApproveResponse approve(PaymentGatewayApproveRequest request) {

        KakaoApproveRequest kakaoReq = KakaoApproveRequest.builder()
            .cid(props.getCid())
            .cid_secret(props.getCid_secret())
            .tid(request.getProviderRefId())
            .partner_order_id(request.getOrderId())
            .partner_user_id(request.getUserId())
            .pg_token(request.getPgToken())
            .build();

        KakaoApproveResponse kakaoRes = client.approve(kakaoReq);

        return PaymentGatewayApproveResponse.builder()
            .providerPaymentId(kakaoRes.getTid())
            .pgApproveJson(toJson(kakaoRes))
            .build();
    }

    @Override
    public PaymentGatewayRefundResponse refund(PaymentGatewayRefundRequest request) {
        int cancelAmount = toIntExact(request.getRefundPrice(), "refundPrice");
        int cancelTaxFreeAmount = 0;

        KakaoCancelResponse kakaoRes = client.cancel(
            KakaoCancelRequest.builder()
                .cid(props.getCid())
                .cid_secret(props.getCid_secret())
                .tid(request.getProviderPaymentId())
                .cancel_amount(cancelAmount)
                .cancel_tax_free_amount(cancelTaxFreeAmount)
                .build()
        );

        boolean success = kakaoRes.getStatus() != null
            && ("CANCEL_PAYMENT".equalsIgnoreCase(kakaoRes.getStatus())
                || "PART_CANCEL_PAYMENT".equalsIgnoreCase(kakaoRes.getStatus())
                || "CANCEL".equalsIgnoreCase(kakaoRes.getStatus()));

        return PaymentGatewayRefundResponse.builder()
            .success(success)
            .refundResultJson(toJson(kakaoRes))
            .build();
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new PaymentGatewayException("KAKAO", "JSON_SERIALIZE_FAIL", "json serialize failed", null);
        }
    }

    private static <T> T nvl(T v, T def) {
        return v == null ? def : v;
    }

    private static Integer toIntExact(BigDecimal v, String field) {
        if (v == null) {
            throw new IllegalArgumentException(field + " is required");
        }
        try {
            return v.intValueExact();
        } catch (ArithmeticException e) {
            throw new IllegalArgumentException(field + " must be integer(no decimals): " + v);
        }
    }
}
