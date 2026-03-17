package org.myweb.uniplace.domain.payment.application.gateway.toss.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class TossCancelResponse {

    @JsonProperty("code")
    private Integer code;

    @JsonProperty("errorCode")
    private String errorCode;

    @JsonProperty("msg")
    private String msg;

    @JsonProperty("refundNo")
    private String refundNo;

    @JsonProperty("payToken")
    private String payToken;

    @JsonProperty("transactionId")
    private String transactionId;

    @JsonProperty("payStatus")
    private String payStatus;

    @JsonProperty("refundedAmount")
    private Integer refundedAmount;
}
