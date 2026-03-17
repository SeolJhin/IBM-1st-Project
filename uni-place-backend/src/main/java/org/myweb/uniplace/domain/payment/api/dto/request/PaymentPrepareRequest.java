package org.myweb.uniplace.domain.payment.api.dto.request;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentPrepareRequest {

    private Integer serviceGoodsId;

    // Exactly one target must be provided.
    private Integer orderId;
    private Integer chargeId;

    private String provider; // KAKAO
    private Integer paymentMethodId;
    private String idempotencyKey;

    // optional: tax-exempt amount (KRW)
    private BigDecimal taxExScopeAmount;
}
