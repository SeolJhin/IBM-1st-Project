package org.myweb.uniplace.domain.payment.application.gateway.toss;

import java.math.BigDecimal;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
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
import org.myweb.uniplace.domain.payment.application.gateway.toss.dto.TossReadyRequest;
import org.myweb.uniplace.domain.payment.application.gateway.toss.dto.TossReadyResponse;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TossGateway implements PaymentGateway {

    private final TossClient client;
    private final TossProperties props;
    private final ObjectMapper objectMapper;

    @Override
    public String provider() {
        return "TOSS";
    }

    @Override
    public PaymentGatewayReadyResponse ready(PaymentGatewayReadyRequest request) {
        String secretKey = resolveSecretKey();
        if (secretKey == null || secretKey.isBlank()) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }

        TossReadyResponse tossRes = client.create(
            TossReadyRequest.builder()
                .orderId(request.getOrderId())
                .orderName(nvl(request.getItemName(), "order"))
                .method("CARD")
                .amount(toIntExact(request.getTotalPrice(), "amount"))
                .successUrl(request.getApprovalUrl())
                .failUrl(request.getFailUrl())
                .build()
        );

        String checkoutUrl = tossRes.getCheckout() == null ? null : tossRes.getCheckout().getUrl();
        if (!hasText(checkoutUrl)) {
            throw new PaymentGatewayException("TOSS", "TOSS_READY_FAILED", "toss ready failed", null);
        }

        return PaymentGatewayReadyResponse.builder()
            .paymentId(request.getPaymentId())
            .providerRefId(firstNonBlank(tossRes.getPaymentKey(), request.getOrderId()))
            .redirectPcUrl(checkoutUrl)
            .redirectMobileUrl(checkoutUrl)
            .redirectAppUrl(checkoutUrl)
            .pgReadyJson(toJson(tossRes))
            .build();
    }

    @Override
    public PaymentGatewayApproveResponse approve(PaymentGatewayApproveRequest request) {
        String paymentKey = firstNonBlank(request.getPaymentKey(), request.getProviderRefId(), request.getPayToken());
        String orderId = request.getOrderId();
        int amount = toIntExact(request.getAmount(), "amount");
        String secretKey = resolveSecretKey();

        if (paymentKey == null || paymentKey.isBlank()) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
        if (orderId == null || orderId.isBlank()) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
        if (secretKey == null || secretKey.isBlank()) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }

        TossApproveResponse tossRes = client.confirm(
            TossApproveRequest.builder()
                .paymentKey(paymentKey)
                .orderId(orderId)
                .amount(amount)
                .build()
        );
        boolean approved = "DONE".equalsIgnoreCase(tossRes.getStatus());
        if (!approved) {
            throw new PaymentGatewayException("TOSS", "TOSS_EXECUTE_FAILED", "toss execute failed", null);
        }

        Integer captured = tossRes.getTotalAmount();

        return PaymentGatewayApproveResponse.builder()
            .providerPaymentId(firstNonBlank(tossRes.getPaymentKey(), paymentKey))
            .gatewayStatus("PAID")
            .merchantUid(tossRes.getOrderId())
            .currency("KRW")
            .capturedPrice(captured == null ? null : BigDecimal.valueOf(captured))
            .pgApproveJson(toJson(tossRes))
            .build();
    }

    @Override
    public PaymentGatewayRefundResponse refund(PaymentGatewayRefundRequest request) {
        String secretKey = resolveSecretKey();
        String orderNo = request.getOrderNo();
        if (!hasText(secretKey) || !hasText(orderNo)) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }

        JsonNode status = client.getByOrderId(orderNo);
        if (!isApiSuccess(status)) {
            throw new PaymentGatewayException("TOSS", "TOSS_STATUS_FAILED", "toss status failed", status == null ? null : status.toString());
        }
        String paymentKey = firstNonBlank(text(status, "paymentKey"), request.getProviderPaymentId());
        if (!hasText(paymentKey)) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }

        TossCancelRequest cancelReq = TossCancelRequest.builder()
            .cancelReason(nvl(request.getRefundReason(), "refund"))
            .cancelAmount(toNullableInt(request.getRefundPrice()))
            .build();

        TossCancelResponse tossRes = client.cancel(paymentKey, cancelReq);

        boolean success = hasText(tossRes.getStatus())
            && tossRes.getStatus().toUpperCase().startsWith("CANCELED");

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

    private String resolveSecretKey() {
        String secretKey = props.getSecret_key();
        if (hasText(secretKey)) {
            return secretKey;
        }
        return props.getApi_key();
    }

    private static String resolveResultCallback(String approvalUrl) {
        if (!hasText(approvalUrl)) {
            return null;
        }
        int index = approvalUrl.indexOf("/payments/callback/");
        if (index < 0) {
            return null;
        }
        return approvalUrl.substring(0, index) + "/payments/webhook/toss";
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
            throw new BusinessException(ErrorCode.PAYMENT_REFUND_INVALID_AMOUNT);
        }
    }

    private static Integer toNullableInt(BigDecimal v, int defaultValue) {
        Integer out = toNullableInt(v);
        return out == null ? defaultValue : out;
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static boolean isApiSuccess(JsonNode node) {
        if (node == null || node.isNull()) {
            return false;
        }
        JsonNode code = node.get("code");
        if (code != null && code.isInt() && code.intValue() == 0) {
            return true;
        }
        return hasText(text(node, "paymentKey")) || hasText(text(node, "status"));
    }

    private static String text(JsonNode node, String field) {
        if (node == null || field == null) {
            return null;
        }
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String out = value.asText();
        return hasText(out) ? out : null;
    }
}
