package org.myweb.uniplace.domain.payment.application.gateway.naver.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class NaverHistoryResponse {

    @JsonProperty("code")
    private String code;

    @JsonProperty("message")
    private String message;

    @JsonProperty("body")
    private Body body;

    @Getter
    public static class Body {

        @JsonProperty("list")
        private List<HistoryItem> list;
    }

    @Getter
    public static class HistoryItem {

        @JsonProperty("paymentId")
        private String paymentId;

        @JsonProperty("admissionState")
        private String admissionState;

        @JsonProperty("admissionTypeCode")
        private String admissionTypeCode;

        @JsonProperty("totalPayAmount")
        private Integer totalPayAmount;

        @JsonProperty("merchantPayKey")
        private String merchantPayKey;
    }
}
