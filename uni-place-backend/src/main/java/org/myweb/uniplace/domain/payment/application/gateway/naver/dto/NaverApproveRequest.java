package org.myweb.uniplace.domain.payment.application.gateway.naver.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NaverApproveRequest {

    private String paymentId;

    // optional header: X-NaverPay-Idempotency-Key
    private String idempotencyKey;
}
