package org.myweb.uniplace.domain.payment.api.dto.request;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentApproveRequest {

    private Integer paymentId;

    // 카카오 approve 필수
    private String pgToken;

    private BigDecimal capturedPrice;
}