package org.myweb.uniplace.domain.payment.application.gateway.toss.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TossReadyRequest {

    @JsonProperty("orderId")
    private String orderId;

    @JsonProperty("orderName")
    private String orderName;

    @JsonProperty("method")
    private String method;

    @JsonProperty("amount")
    private Integer amount;

    @JsonProperty("successUrl")
    private String successUrl;

    @JsonProperty("failUrl")
    private String failUrl;
}
