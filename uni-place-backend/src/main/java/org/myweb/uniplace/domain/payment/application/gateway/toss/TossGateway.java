package org.myweb.uniplace.domain.payment.application.gateway.toss;

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
import org.myweb.uniplace.domain.payment.application.gateway.toss.dto.TossApproveRequest;
import org.myweb.uniplace.domain.payment.application.gateway.toss.dto.TossApproveResponse;
import org.myweb.uniplace.domain.payment.application.gateway.toss.dto.TossCancelRequest;
import org.myweb.uniplace.domain.payment.application.gateway.toss.dto.TossCancelResponse;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TossGateway implements PaymentGateway {

    private final TossClient client;
    private final ObjectMapper objectMapper;

    @Override
    public String provider() {
        return "TOSS";
    }

    @Override
    public PaymentGatewayReadyResponse ready(PaymentGatewayReadyRequest request) {
        // Toss Payments uses frontend widget; no server-side ready call
        return PaymentGatewayReadyResponse.builder()
            .paymentId(request.getPaymentId())
            .providerRefId(request.getOrderId())
            .build();
    }

    @Override
    public PaymentGatewayApproveResponse approve(PaymentGatewayApproveRequest request) {
        String paymentKey = request.getPaymentKey();
        String orderId = request.getOrderId();
        int amount = toIntExact(request.getAmount(), "amount");

        if (paymentKey == null || paymentKey.isBlank()) {
            throw new IllegalArgumentException("paymentKey is required for TOSS confirm");
        }
        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("orderId is required for TOSS confirm");
        }

        TossApproveResponse tossRes = client.confirm(
            TossApproveRequest.builder()
                .paymentKey(paymentKey)
                .orderId(orderId)
                .amount(amount)
                .build()
        );

        return PaymentGatewayApproveResponse.builder()
            .providerPaymentId(tossRes.getPaymentKey())
            .gatewayStatus(tossRes.getStatus())
            .merchantUid(tossRes.getOrderId())
            .currency("KRW")
            .capturedPrice(tossRes.getTotalAmount() == null ? null : BigDecimal.valueOf(tossRes.getTotalAmount()))
            .pgApproveJson(toJson(tossRes))
            .build();
    }

    @Override
    public PaymentGatewayRefundResponse refund(PaymentGatewayRefundRequest request) {
        String paymentKey = request.getProviderPaymentId();
        if (paymentKey == null || paymentKey.isBlank()) {
            throw new IllegalArgumentException("providerPaymentId(paymentKey) is required for TOSS cancel");
        }

        TossCancelRequest cancelReq = TossCancelRequest.builder()
            .cancelReason(nvl(request.getRefundReason(), "cancel"))
            .cancelAmount(toNullableInt(request.getRefundPrice()))
            .build();

        TossCancelResponse tossRes = client.cancel(paymentKey, cancelReq);

        boolean success = tossRes.getStatus() != null
            && ("CANCELED".equalsIgnoreCase(tossRes.getStatus())
                || "PARTIAL_CANCELED".equalsIgnoreCase(tossRes.getStatus()));

        return PaymentGatewayRefundResponse.builder()
            .success(success)
            .refundResultJson(toJson(tossRes))
            .build();
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new PaymentGatewayException("TOSS", "JSON_SERIALIZE_FAIL", "json serialize failed", null);
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

    private static Integer toNullableInt(BigDecimal v) {
        if (v == null) {
            return null;
        }
        try {
            return v.intValueExact();
        } catch (ArithmeticException e) {
            throw new IllegalArgumentException("refundPrice must be integer(no decimals): " + v);
        }
    }
}
