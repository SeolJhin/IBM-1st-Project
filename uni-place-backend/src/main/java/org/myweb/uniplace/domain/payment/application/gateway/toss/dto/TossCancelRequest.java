package org.myweb.uniplace.domain.payment.application.gateway.toss.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TossCancelRequest {

    @JsonProperty("apiKey")
    private String apiKey;

    @JsonProperty("payToken")
    private String payToken;

    @JsonProperty("orderNo")
    private String orderNo;

    @JsonProperty("refundNo")
    private String refundNo;

    @JsonProperty("reason")
    private String reason;

    @JsonProperty("amount")
    private Integer amount;

    @JsonProperty("idempotent")
    private Boolean idempotent;
}
