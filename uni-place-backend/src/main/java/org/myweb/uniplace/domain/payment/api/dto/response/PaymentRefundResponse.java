package org.myweb.uniplace.domain.payment.api.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentRefundResponse {

    private Integer paymentId;
    private Integer refundId;
    private String paymentSt;
}