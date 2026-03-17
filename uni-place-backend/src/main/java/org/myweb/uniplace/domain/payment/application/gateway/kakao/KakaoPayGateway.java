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
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
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
        if (!hasText(kakaoRes.getTid())) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
        if (!hasText(kakaoRes.getPartner_order_id()) || !kakaoRes.getPartner_order_id().equals(request.getOrderId())) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
        if (hasText(request.getUserId())
            && hasText(kakaoRes.getPartner_user_id())
            && !kakaoRes.getPartner_user_id().equals(request.getUserId())) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }

        return PaymentGatewayApproveResponse.builder()
            .providerPaymentId(kakaoRes.getTid())
            .gatewayStatus("APPROVED")
            .merchantUid(kakaoRes.getPartner_order_id())
            .currency("KRW")
            .capturedPrice(request.getAmount())
            .pgApproveJson(toJson(kakaoRes))
            .build();
    }

    @Override
    public PaymentGatewayRefundResponse refund(PaymentGatewayRefundRequest request) {
        if (!hasText(request.getProviderPaymentId())) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
        int cancelAmount = toIntExact(request.getRefundPrice(), "refundPrice");
        int cancelTaxFreeAmount = resolveCancelTaxFreeAmount(request, cancelAmount);

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
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
        try {
            return v.intValueExact();
        } catch (ArithmeticException e) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
    }

    private static Integer toNullableInt(BigDecimal v) {
        if (v == null) {
            return null;
        }
        try {
            return v.intValueExact();
        } catch (ArithmeticException e) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
    }

    private static int resolveCancelTaxFreeAmount(PaymentGatewayRefundRequest request, int cancelAmount) {
        Integer originalTaxExRaw = toNullableInt(request.getOriginalTaxExScopePrice());
        if (originalTaxExRaw == null || originalTaxExRaw <= 0) {
            return 0;
        }

        Integer originalTotalRaw = toNullableInt(request.getOriginalTotalPrice());
        if (originalTotalRaw == null || originalTotalRaw <= 0 || cancelAmount >= originalTotalRaw) {
            return clamp(originalTaxExRaw, 0, cancelAmount);
        }

        long multiplied = (long) originalTaxExRaw * (long) cancelAmount;
        int proportional = (int) (multiplied / originalTotalRaw);
        return clamp(proportional, 0, cancelAmount);
    }

    private static int clamp(int value, int min, int max) {
        if (value < min) {
            return min;
        }
        return Math.min(value, max);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
