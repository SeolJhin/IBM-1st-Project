package org.myweb.uniplace.domain.payment.application.gateway.toss.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TossApproveRequest {

    @JsonProperty("apiKey")
    private String apiKey;

    @JsonProperty("payToken")
    private String payToken;

    @JsonProperty("orderNo")
    private String orderNo;

    @JsonProperty("amount")
    private Integer amount;
}
