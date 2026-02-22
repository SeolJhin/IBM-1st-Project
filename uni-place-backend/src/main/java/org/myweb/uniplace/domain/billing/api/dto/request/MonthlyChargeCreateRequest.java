package org.myweb.uniplace.domain.billing.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class MonthlyChargeCreateRequest {

    @NotNull
    private Integer contractId;

    @NotBlank
    private String chargeType;

    @NotBlank
    private String billingDt;

    @NotNull
    private BigDecimal price;

    private String chargeSt;

    private Integer paymentId;
}
