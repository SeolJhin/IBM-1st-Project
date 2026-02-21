package org.myweb.uniplace.domain.payment.application.gateway.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentGatewayRefundResponse {

    private boolean success;
    private String refundResultJson;
}