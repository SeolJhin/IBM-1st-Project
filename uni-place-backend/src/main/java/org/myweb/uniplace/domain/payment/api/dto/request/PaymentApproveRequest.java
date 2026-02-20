package org.myweb.uniplace.domain.payment.api.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentApproveRequest {

    private Integer paymentId;
    private String providerPaymentId;
    private String providerTid;
}