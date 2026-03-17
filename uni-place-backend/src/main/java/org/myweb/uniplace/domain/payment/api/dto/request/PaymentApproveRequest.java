package org.myweb.uniplace.domain.payment.api.dto.request;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentApproveRequest {

    private Integer paymentId;
    private String merchantUid;

    // kakao approve
    private String pgToken;

    // toss confirm
    private String paymentKey;
    private String payToken;

    private BigDecimal capturedPrice;
}
