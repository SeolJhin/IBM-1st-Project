package org.myweb.uniplace.domain.payment.application.gateway.toss.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;

@Getter
public class TossApproveResponse {

    @JsonProperty("paymentKey")
    private String paymentKey;

    @JsonProperty("orderId")
    private String orderId;

    @JsonProperty("method")
    private String method;

    @JsonProperty("totalAmount")
    private Integer totalAmount;

    @JsonProperty("balanceAmount")
    private Integer balanceAmount;

    @JsonProperty("status")
    private String status;

    @JsonProperty("cancels")
    private JsonNode cancels;
}
