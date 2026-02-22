package org.myweb.uniplace.domain.payment.application.gateway.naver.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class NaverReadyResponse {

    @JsonProperty("code")
    private String code;

    @JsonProperty("message")
    private String message;

    @JsonProperty("body")
    private Body body;

    @Getter
    public static class Body {

        @JsonProperty("reserveId")
        private String reserveId;
    }
}
