package org.myweb.uniplace.domain.billing.api.dto.response;

import lombok.Getter;
import org.myweb.uniplace.domain.billing.domain.entity.MonthlyCharge;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
public class MonthlyChargeDetailResponse {

    private Integer chargeId;
    private Integer contractId;
    private String chargeType;
    private String billingDt;
    private BigDecimal price;
    private String chargeSt;
    private Integer paymentId;
    private LocalDateTime createdAt;

    public MonthlyChargeDetailResponse(MonthlyCharge monthlyCharge) {
        this.chargeId = monthlyCharge.getChargeId();
        this.contractId = monthlyCharge.getContractId();
        this.chargeType = monthlyCharge.getChargeType();
        this.billingDt = monthlyCharge.getBillingDt();
        this.price = monthlyCharge.getPrice();
        this.chargeSt = monthlyCharge.getChargeSt();
        this.paymentId = monthlyCharge.getPaymentId();
        this.createdAt = monthlyCharge.getCreatedAt();
    }
}
