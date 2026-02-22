package org.myweb.uniplace.domain.payment.application.gateway.toss.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;

@Getter
public class TossCancelResponse {

    @JsonProperty("paymentKey")
    private String paymentKey;

    @JsonProperty("orderId")
    private String orderId;

    @JsonProperty("status")
    private String status;

    @JsonProperty("cancels")
    private JsonNode cancels;
}
