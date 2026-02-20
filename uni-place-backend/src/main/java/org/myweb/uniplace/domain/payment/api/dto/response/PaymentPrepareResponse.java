package org.myweb.uniplace.domain.payment.api.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentPrepareResponse {

    private Integer paymentId;
    private String merchantUid;
    private String status;
}