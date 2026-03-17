package org.myweb.uniplace.domain.payment.application.gateway.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentGatewayApproveRequest {

    private Integer paymentId;
    private String userId;

    private String providerRefId; // tid
    private String pgToken;        // kakao pg_token

    // toss confirm
    private String paymentKey;
    private String payToken;
    private String orderId;
    private java.math.BigDecimal amount;
}
