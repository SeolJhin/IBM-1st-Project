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
        String apiKey = resolveApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }

        TossReadyResponse tossRes = client.create(
            TossReadyRequest.builder()
                .apiKey(apiKey)
                .orderNo(request.getOrderId())
                .productDesc(nvl(request.getItemName(), "order"))
                .retUrl(request.getApprovalUrl())
                .retCancelUrl(request.getCancelUrl())
                .amount(toIntExact(request.getTotalPrice(), "amount"))
                .amountTaxFree(toNullableInt(request.getTaxFreePrice(), 0))
                .resultCallback(resolveResultCallback(request.getApprovalUrl()))
                .autoExecute(false)
                .callbackVersion("V2")
                .build()
        );

        if (tossRes.getCode() == null || tossRes.getCode() != 0 || !hasText(tossRes.getPayToken())) {
            throw new PaymentGatewayException("TOSS", "TOSS_READY_FAILED", nvl(tossRes.getMsg(), "toss ready failed"), null);
        }

        return PaymentGatewayReadyResponse.builder()
            .paymentId(request.getPaymentId())
            .providerRefId(tossRes.getPayToken())
            .redirectPcUrl(tossRes.getCheckoutPage())
            .redirectMobileUrl(tossRes.getCheckoutPage())
            .redirectAppUrl(tossRes.getCheckoutPage())
            .pgReadyJson(toJson(tossRes))
            .build();
    }

    @Override
    public PaymentGatewayApproveResponse approve(PaymentGatewayApproveRequest request) {
        String payToken = firstNonBlank(request.getPayToken(), request.getProviderRefId(), request.getPaymentKey());
        String orderNo = request.getOrderId();
        int amount = toIntExact(request.getAmount(), "amount");
        String apiKey = resolveApiKey();

        if (payToken == null || payToken.isBlank()) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
        if (orderNo == null || orderNo.isBlank()) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }
        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }

        TossApproveResponse tossRes = client.confirm(
            TossApproveRequest.builder()
                .apiKey(apiKey)
                .payToken(payToken)
                .orderNo(orderNo)
                .amount(amount)
                .build()
        );
        boolean approved = tossRes.getCode() != null && tossRes.getCode() == 0;
        if (!approved) {
            throw new PaymentGatewayException("TOSS", "TOSS_EXECUTE_FAILED", nvl(tossRes.getMsg(), "toss execute failed"), null);
        }

        Integer captured = tossRes.getPaidAmount() != null ? tossRes.getPaidAmount() : tossRes.getAmount();

        return PaymentGatewayApproveResponse.builder()
            .providerPaymentId(firstNonBlank(tossRes.getTransactionId(), tossRes.getPayToken()))
            .gatewayStatus("PAID")
            .merchantUid(tossRes.getOrderNo())
            .currency("KRW")
            .capturedPrice(captured == null ? null : BigDecimal.valueOf(captured))
            .pgApproveJson(toJson(tossRes))
            .build();
    }

    @Override
    public PaymentGatewayRefundResponse refund(PaymentGatewayRefundRequest request) {
        String paymentKey = request.getProviderPaymentId();
        if (paymentKey == null || paymentKey.isBlank()) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
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

    private String resolveApiKey() {
        String apiKey = props.getApi_key();
        if (hasText(apiKey)) {
            return apiKey;
        }
        return props.getSecret_key();
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
}
