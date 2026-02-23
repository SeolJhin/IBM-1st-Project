package org.myweb.uniplace.domain.payment.application.gateway.kakao.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class KakaoCancelResponse {

    @JsonProperty("tid")
    private String tid;

    @JsonProperty("aid")
    private String aid;

    @JsonProperty("status")
    private String status;

    @JsonProperty("canceled_at")
    private String canceled_at;

    @JsonProperty("approved_cancel_amount")
    private Amount approved_cancel_amount;

    @JsonProperty("cancel_available_amount")
    private Amount cancel_available_amount;

    @Getter
    public static class Amount {
        @JsonProperty("total")
        private Integer total;

        @JsonProperty("tax_free")
        private Integer tax_free;

        @JsonProperty("vat")
        private Integer vat;

        @JsonProperty("point")
        private Integer point;

        @JsonProperty("discount")
        private Integer discount;

        @JsonProperty("green_deposit")
        private Integer green_deposit;
    }
}
