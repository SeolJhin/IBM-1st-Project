package org.myweb.uniplace.domain.payment.application.gateway.dto;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentGatewayRefundRequest {

    private Integer paymentId;
    private String userId;

    private String providerPaymentId; // payment.providerPaymentId
    private String orderNo; // payment.merchantUid
    private BigDecimal refundPrice;
    private String refundReason;

    // Original captured/approved amount snapshots for tax split on partial refund
    private BigDecimal originalTotalPrice;
    private BigDecimal originalTaxScopePrice;
    private BigDecimal originalTaxExScopePrice;
    private BigDecimal originalEnvironmentDepositAmount;
}
