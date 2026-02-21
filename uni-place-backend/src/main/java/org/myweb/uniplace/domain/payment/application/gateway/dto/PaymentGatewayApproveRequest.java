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
}