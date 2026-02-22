package org.myweb.uniplace.domain.billing.api.dto.response;

import lombok.Getter;
import org.myweb.uniplace.domain.billing.domain.entity.BillingOrder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
public class BillingOrderResponse {

    private Integer orderId;
    private Integer contractId;
    private Integer chargeId;
    private BigDecimal amount;
    private String orderSt;
    private Integer paymentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BillingOrderResponse(BillingOrder order) {
        this.orderId = order.getOrderId();
        this.contractId = order.getContractId();
        this.chargeId = order.getChargeId();
        this.amount = order.getAmount();
        this.orderSt = order.getOrderSt();
        this.paymentId = order.getPaymentId();
        this.createdAt = order.getCreatedAt();
        this.updatedAt = order.getUpdatedAt();
    }
}
