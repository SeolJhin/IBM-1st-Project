package org.myweb.uniplace.domain.payment.application.gateway.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentGatewayApproveResponse {

    private String providerPaymentId;
    private String gatewayStatus;
    private String merchantUid;
    private String currency;
    private BigDecimal capturedPrice;
    private String pgApproveJson;
}
