package org.myweb.uniplace.domain.payment.application.gateway.naver.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;

@Getter
public class NaverApproveResponse {

    @JsonProperty("code")
    private String code;

    @JsonProperty("message")
    private String message;

    @JsonProperty("body")
    private Body body;

    @Getter
    public static class Body {

        @JsonProperty("paymentId")
        private String paymentId;

        @JsonProperty("detail")
        private JsonNode detail;
    }
}
