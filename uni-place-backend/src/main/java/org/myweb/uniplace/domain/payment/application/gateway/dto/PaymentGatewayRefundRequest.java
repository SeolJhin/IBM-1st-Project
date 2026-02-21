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
    private BigDecimal refundPrice;
    private String refundReason;
    

    
}