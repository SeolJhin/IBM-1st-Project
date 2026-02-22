package org.myweb.uniplace.domain.payment.api.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PaymentPrepareRequest {

    private String userId;
    private Integer serviceGoodsId;
    private BigDecimal amount;
    private String provider; // KAKAO
    private Integer paymentMethodId;
    private Integer orderId;
    private String orderType;
}
