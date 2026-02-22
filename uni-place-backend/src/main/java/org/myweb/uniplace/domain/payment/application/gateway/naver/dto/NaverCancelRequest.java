package org.myweb.uniplace.domain.payment.application.gateway.naver.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NaverCancelRequest {

    private String paymentId;
    private Integer cancelAmount;
    private String cancelReason;
    private String cancelRequester;
    private Integer taxScopeAmount;
    private Integer taxExScopeAmount;

    private String merchantPayTransactionKey;
    private Integer environmentDepositAmount;
    private Integer doCompareRest;
    private Integer expectedRestAmount;

    // optional header: X-NaverPay-Idempotency-Key
    private String idempotencyKey;
}
