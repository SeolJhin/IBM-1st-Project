package org.myweb.uniplace.domain.payment.application.gateway.toss.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TossReadyRequest {

    @JsonProperty("apiKey")
    private String apiKey;

    @JsonProperty("orderNo")
    private String orderNo;

    @JsonProperty("productDesc")
    private String productDesc;

    @JsonProperty("retUrl")
    private String retUrl;

    @JsonProperty("retCancelUrl")
    private String retCancelUrl;

    @JsonProperty("amount")
    private Integer amount;

    @JsonProperty("amountTaxFree")
    private Integer amountTaxFree;

    @JsonProperty("resultCallback")
    private String resultCallback;

    @JsonProperty("autoExecute")
    private Boolean autoExecute;

    @JsonProperty("callbackVersion")
    private String callbackVersion;
}
