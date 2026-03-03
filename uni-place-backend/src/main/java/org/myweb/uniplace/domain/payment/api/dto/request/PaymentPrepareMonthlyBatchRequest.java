package org.myweb.uniplace.domain.payment.api.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PaymentPrepareMonthlyBatchRequest {

    private Integer serviceGoodsId;
    private List<Integer> chargeIds;
    private String provider;
    private Integer paymentMethodId;
}

