package org.myweb.uniplace.domain.payment.application.gateway.dto;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentGatewayReadyRequest {

    private Integer paymentId;   // DB: payment_id
    private String userId;       // DB: user_id
    private String orderId;      // merchant order id (use paymentId string if none)

    private String itemName;     // kakao: item_name
    private Integer quantity;    // kakao: quantity (보통 1)

    private BigDecimal totalPrice;    // DB: total_price
    private BigDecimal taxFreePrice;  // DB: tax_free_price (없으면 0)

    private String approvalUrl;
    private String cancelUrl;
    private String failUrl;
}
