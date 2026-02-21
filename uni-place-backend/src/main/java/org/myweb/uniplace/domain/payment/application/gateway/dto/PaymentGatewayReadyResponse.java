package org.myweb.uniplace.domain.payment.application.gateway.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentGatewayReadyResponse {

	
    private Integer paymentId;
    // payment_intent.provider_ref_id (kakao: tid)
    private String providerRefId;

    private String redirectPcUrl;
    private String redirectMobileUrl;
    private String redirectAppUrl;

    // payment_intent.pg_ready_json (원문 JSON)
    private String pgReadyJson;
}