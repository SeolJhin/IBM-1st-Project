package org.myweb.uniplace.domain.payment.application.gateway.naver;

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
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverApproveRequest;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverApproveResponse;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverCancelRequest;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverCancelResponse;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverReadyRequest;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverReadyResponse;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NaverPayGateway implements PaymentGateway {

    private final NaverPayProperties props;
    private final NaverPayClient client;
    private final ObjectMapper objectMapper;

    @Override
    public String provider() {
        return "NAVER";
    }

    @Override
    public PaymentGatewayReadyResponse ready(PaymentGatewayReadyRequest request) {
        int totalPayAmount = toIntExact(request.getTotalPrice(), "totalPrice");
        int taxExScopeAmount = toIntExact(nvl(request.getTaxFreePrice(), BigDecimal.ZERO), "taxFreePrice");
        int taxScopeAmount = totalPayAmount - taxExScopeAmount;

        if (taxScopeAmount < 0) {
            throw new IllegalArgumentException("taxFreePrice must be <= totalPrice");
        }

        NaverReadyRequest naverReq = NaverReadyRequest.builder()
            .merchantPayKey(String.valueOf(request.getPaymentId()))
            .merchantUserKey(request.getUserId())
            .productName(nvl(request.getItemName(), "uni-place"))
            .productCount(nvl(request.getQuantity(), 1))
            .totalPayAmount(totalPayAmount)
            .taxScopeAmount(taxScopeAmount)
            .taxExScopeAmount(taxExScopeAmount)
            .returnUrl(request.getApprovalUrl())
            .build();

        NaverReadyResponse naverRes = client.reserve(naverReq);

        String reserveId = naverRes.getBody() != null ? naverRes.getBody().getReserveId() : null;
        String paymentPageUrl = buildPaymentPageUrl(reserveId);

        return PaymentGatewayReadyResponse.builder()
            .providerRefId(reserveId)
            .redirectPcUrl(paymentPageUrl)
            .redirectMobileUrl(paymentPageUrl)
            .redirectAppUrl(paymentPageUrl)
            .pgReadyJson(toJson(naverRes))
            .build();
    }

    @Override
    public PaymentGatewayApproveResponse approve(PaymentGatewayApproveRequest request) {
        String paymentId = request.getPgToken();
        if (paymentId == null || paymentId.isBlank()) {
            throw new IllegalArgumentException("pgToken(paymentId) is required for NAVER approve");
        }

        NaverApproveResponse naverRes = client.approve(
            NaverApproveRequest.builder()
                .paymentId(paymentId)
                .idempotencyKey("PAY-" + paymentId)
                .build()
        );

        String providerPaymentId = paymentId;
        if (naverRes.getBody() != null && naverRes.getBody().getPaymentId() != null) {
            providerPaymentId = naverRes.getBody().getPaymentId();
        }

        return PaymentGatewayApproveResponse.builder()
            .providerPaymentId(providerPaymentId)
            .pgApproveJson(toJson(naverRes))
            .build();
    }

    @Override
    public PaymentGatewayRefundResponse refund(PaymentGatewayRefundRequest request) {
        int cancelAmount = toIntExact(request.getRefundPrice(), "refundPrice");
        int taxExScopeAmount = 0;
        int taxScopeAmount = cancelAmount;

        NaverCancelResponse naverRes = client.cancel(
            NaverCancelRequest.builder()
                .paymentId(request.getProviderPaymentId())
                .cancelAmount(cancelAmount)
                .cancelReason(nvl(request.getRefundReason(), "cancel"))
                .cancelRequester("2")
                .taxScopeAmount(taxScopeAmount)
                .taxExScopeAmount(taxExScopeAmount)
                .idempotencyKey("CANCEL-" + request.getProviderPaymentId() + "-" + cancelAmount)
                .build()
        );

        boolean success = naverRes.getCode() != null && "Success".equalsIgnoreCase(naverRes.getCode());

        return PaymentGatewayRefundResponse.builder()
            .success(success)
            .refundResultJson(toJson(naverRes))
            .build();
    }

    private String buildPaymentPageUrl(String reserveId) {
        if (reserveId == null || reserveId.isBlank()) {
            return null;
        }
        String base = props.getService_base_url();
        if (base == null || base.isBlank()) {
            return null;
        }
        return base + "/payments/" + reserveId;
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new PaymentGatewayException("NAVER", "JSON_SERIALIZE_FAIL", "json serialize failed", null);
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
