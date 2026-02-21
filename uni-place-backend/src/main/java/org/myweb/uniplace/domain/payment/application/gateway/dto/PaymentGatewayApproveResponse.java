package org.myweb.uniplace.domain.payment.application.gateway.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentGatewayApproveResponse {

    private String providerPaymentId; // 보통 tid 저장 (payment.provider_payment_id)
    private String pgApproveJson;     // payment_intent.pg_approve_json
}