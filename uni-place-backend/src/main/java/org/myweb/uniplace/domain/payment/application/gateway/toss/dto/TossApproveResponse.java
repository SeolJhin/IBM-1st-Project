package org.myweb.uniplace.domain.payment.application.gateway.toss.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;

@Getter
public class TossApproveResponse {

    @JsonProperty("code")
    private Integer code;

    @JsonProperty("errorCode")
    private String errorCode;

    @JsonProperty("msg")
    private String msg;

    @JsonProperty("payToken")
    private String payToken;

    @JsonProperty("orderNo")
    private String orderNo;

    @JsonProperty("payMethod")
    private String payMethod;

    @JsonProperty("transactionId")
    private String transactionId;

    @JsonProperty("amount")
    private Integer amount;

    @JsonProperty("paidAmount")
    private Integer paidAmount;

    @JsonProperty("stateMsg")
    private String stateMsg;

    @JsonProperty("cancels")
    private JsonNode cancels;
}
