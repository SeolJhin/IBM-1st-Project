package org.myweb.uniplace.domain.payment.application.gateway.toss.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class TossReadyResponse {

    @JsonProperty("code")
    private Integer code;

    @JsonProperty("errorCode")
    private String errorCode;

    @JsonProperty("msg")
    private String msg;

    @JsonProperty("payToken")
    private String payToken;

    @JsonProperty("checkoutPage")
    private String checkoutPage;
}
