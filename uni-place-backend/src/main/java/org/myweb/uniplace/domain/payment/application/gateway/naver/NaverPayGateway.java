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
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverHistoryByPaymentRequest;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverHistoryResponse;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverReadyRequest;
import org.myweb.uniplace.domain.payment.application.gateway.naver.dto.NaverReadyResponse;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
@Lazy
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
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }

        NaverReadyRequest naverReq = NaverReadyRequest.builder()
            .merchantPayKey(request.getOrderId())
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
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }

        NaverApproveResponse naverRes = client.approve(
            NaverApproveRequest.builder()
                .paymentId(paymentId)
                .idempotencyKey("PAY-" + paymentId)
                .build()
        );

        NaverApproveResponse.Body body = naverRes.getBody();
        NaverApproveResponse.Detail detail = body == null ? null : body.getDetail();
        if (detail == null) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
        if (!"SUCCESS".equalsIgnoreCase(detail.getAdmissionState())) {
            throw new BusinessException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
        if (!hasText(detail.getMerchantPayKey()) || !detail.getMerchantPayKey().equals(request.getOrderId())) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }

        int expectedAmount = toIntExact(request.getAmount(), "amount");
        if (detail.getTotalPayAmount() == null || detail.getTotalPayAmount() != expectedAmount) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }

        String providerPaymentId = paymentId;
        if (body != null && hasText(body.getPaymentId())) {
            providerPaymentId = body.getPaymentId();
        }
        if (hasText(detail.getPaymentId()) && !providerPaymentId.equals(detail.getPaymentId())) {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID_TARGET);
        }

        return PaymentGatewayApproveResponse.builder()
            .providerPaymentId(providerPaymentId)
            .gatewayStatus(detail.getAdmissionState())
            .merchantUid(detail.getMerchantPayKey())
            .currency("KRW")
            .capturedPrice(request.getAmount())
            .pgApproveJson(toJson(naverRes))
            .build();
    }

    @Override
    public PaymentGatewayRefundResponse refund(PaymentGatewayRefundRequest request) {
        int cancelAmount = toIntExact(request.getRefundPrice(), "refundPrice");
        RefundTaxSplit split = resolveRefundTaxSplit(request, cancelAmount);
        String paymentId = request.getProviderPaymentId();
        String orderNo = request.getOrderNo();

        NaverCancelResponse naverRes = client.cancel(
            NaverCancelRequest.builder()
                .paymentId(paymentId)
                .cancelAmount(cancelAmount)
                .cancelReason(nvl(request.getRefundReason(), "cancel"))
                .cancelRequester("2")
                .taxScopeAmount(split.taxScopeAmount())
                .taxExScopeAmount(split.taxExScopeAmount())
                .environmentDepositAmount(split.environmentDepositAmount())
                .idempotencyKey("CANCEL-" + paymentId + "-" + cancelAmount)
                .build()
        );

        boolean success = isCancelSuccess(naverRes, paymentId, cancelAmount);
        if (!success && isPendingCancelCode(naverRes.getCode()) && hasText(paymentId)) {
            NaverHistoryResponse historyRes = client.getHistoryByPaymentId(
                paymentId,
                NaverHistoryByPaymentRequest.builder()
                    .approvalType("CANCEL")
                    .pageNumber(1)
                    .rowsPerPage(50)
                    .build()
            );
            success = hasSuccessfulCancelHistory(historyRes, paymentId, orderNo, cancelAmount);
        }

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

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static RefundTaxSplit resolveRefundTaxSplit(PaymentGatewayRefundRequest request, int cancelAmount) {
        Integer originalTotalNullable = toNullableInt(request.getOriginalTotalPrice());
        int originalTotal = originalTotalNullable == null ? 0 : originalTotalNullable;
        if (originalTotal <= 0 || cancelAmount >= originalTotal) {
            int env = clamp(toNullableInt(request.getOriginalEnvironmentDepositAmount()), 0, cancelAmount);

            Integer originalTaxExRaw = toNullableInt(request.getOriginalTaxExScopePrice());
            Integer originalTaxScopeRaw = toNullableInt(request.getOriginalTaxScopePrice());
            int taxEx = estimateOriginalTaxEx(originalTotal == 0 ? cancelAmount : originalTotal, env, originalTaxExRaw, originalTaxScopeRaw);
            taxEx = clamp(taxEx, 0, cancelAmount - env);
            int taxScope = cancelAmount - env - taxEx;
            return new RefundTaxSplit(taxScope, taxEx, env);
        }

        int originalEnv = clamp(toNullableInt(request.getOriginalEnvironmentDepositAmount()), 0, originalTotal);
        int originalTaxEx = estimateOriginalTaxEx(
            originalTotal,
            originalEnv,
            toNullableInt(request.getOriginalTaxExScopePrice()),
            toNullableInt(request.getOriginalTaxScopePrice())
        );

        int env = proportionalDown(originalEnv, cancelAmount, originalTotal);
        int taxEx = proportionalDown(originalTaxEx, cancelAmount, originalTotal);
        int maxTaxEx = cancelAmount - env;
        if (maxTaxEx < 0) {
            env = cancelAmount;
            taxEx = 0;
        } else if (taxEx > maxTaxEx) {
            taxEx = maxTaxEx;
        }

        int taxScope = cancelAmount - env - taxEx;
        return new RefundTaxSplit(taxScope, taxEx, env);
    }

    private static int estimateOriginalTaxEx(
        int originalTotal,
        int originalEnv,
        Integer originalTaxExRaw,
        Integer originalTaxScopeRaw
    ) {
        int maxTaxAmount = Math.max(0, originalTotal - originalEnv);
        if (originalTaxExRaw != null) {
            return clamp(originalTaxExRaw, 0, maxTaxAmount);
        }
        if (originalTaxScopeRaw != null) {
            int taxScope = clamp(originalTaxScopeRaw, 0, maxTaxAmount);
            return maxTaxAmount - taxScope;
        }
        return 0;
    }

    private static int proportionalDown(int originalPart, int targetTotal, int originalTotal) {
        if (originalPart <= 0 || targetTotal <= 0 || originalTotal <= 0) {
            return 0;
        }
        long multiplied = (long) originalPart * (long) targetTotal;
        return (int) (multiplied / originalTotal);
    }

    private static int clamp(Integer value, int min, int max) {
        int v = value == null ? 0 : value;
        if (v < min) {
            return min;
        }
        return Math.min(v, max);
    }

    private static boolean isCancelSuccess(NaverCancelResponse response, String paymentId, int cancelAmount) {
        if (response == null || !equalsIgnoreCase(response.getCode(), "Success")) {
            return false;
        }

        NaverCancelResponse.Body body = response.getBody();
        if (body == null || !hasText(body.getPaymentId()) || !body.getPaymentId().equals(paymentId)) {
            return false;
        }

        int canceled = nvl(body.getPrimaryPayCancelAmount())
            + nvl(body.getNpointCancelAmount())
            + nvl(body.getGiftCardCancelAmount())
            + nvl(body.getDiscountCancelAmount());

        return canceled <= 0 || canceled == cancelAmount;
    }

    private static boolean isPendingCancelCode(String code) {
        return equalsIgnoreCase(code, "CancelNotComplete")
            || equalsIgnoreCase(code, "AlreadyOnGoing")
            || equalsIgnoreCase(code, "PreCancelNotComplete");
    }

    private static boolean hasSuccessfulCancelHistory(
        NaverHistoryResponse historyRes,
        String paymentId,
        String orderNo,
        int cancelAmount
    ) {
        if (historyRes == null || !equalsIgnoreCase(historyRes.getCode(), "Success")) {
            return false;
        }
        NaverHistoryResponse.Body body = historyRes.getBody();
        if (body == null || body.getList() == null || body.getList().isEmpty()) {
            return false;
        }

        for (NaverHistoryResponse.HistoryItem item : body.getList()) {
            if (item == null) {
                continue;
            }
            if (!hasText(item.getPaymentId()) || !item.getPaymentId().equals(paymentId)) {
                continue;
            }
            if (!equalsIgnoreCase(item.getAdmissionState(), "SUCCESS")) {
                continue;
            }
            if (!"03".equals(item.getAdmissionTypeCode()) && !"04".equals(item.getAdmissionTypeCode())) {
                continue;
            }
            if (hasText(orderNo) && !orderNo.equals(item.getMerchantPayKey())) {
                continue;
            }
            if (item.getTotalPayAmount() == null || item.getTotalPayAmount() != cancelAmount) {
                continue;
            }
            return true;
        }
        return false;
    }

    private static boolean equalsIgnoreCase(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        return a.equalsIgnoreCase(b);
    }

    private static int nvl(Integer value) {
        return value == null ? 0 : value;
    }

    private record RefundTaxSplit(
        int taxScopeAmount,
        int taxExScopeAmount,
        int environmentDepositAmount
    ) {
    }
}
