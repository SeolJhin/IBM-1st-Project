package org.myweb.uniplace.domain.payment.api.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class PaymentPrepareMonthlyBatchRequest {

    private Integer serviceGoodsId;
    private List<Integer> chargeIds;
    private String provider;
    private Integer paymentMethodId;

    // optional: tax-exempt amount (KRW)
    private BigDecimal taxExScopeAmount;
}
