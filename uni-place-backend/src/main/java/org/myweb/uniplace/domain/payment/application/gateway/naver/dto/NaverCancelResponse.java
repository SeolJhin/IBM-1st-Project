package org.myweb.uniplace.domain.payment.application.gateway.naver.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class NaverCancelResponse {

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

        @JsonProperty("payHistId")
        private String payHistId;

        @JsonProperty("primaryPayMeans")
        private String primaryPayMeans;

        @JsonProperty("primaryPayCancelAmount")
        private Integer primaryPayCancelAmount;

        @JsonProperty("primaryPayRestAmount")
        private Integer primaryPayRestAmount;

        @JsonProperty("npointCancelAmount")
        private Integer npointCancelAmount;

        @JsonProperty("npointRestAmount")
        private Integer npointRestAmount;

        @JsonProperty("giftCardCancelAmount")
        private Integer giftCardCancelAmount;

        @JsonProperty("giftCardRestAmount")
        private Integer giftCardRestAmount;

        @JsonProperty("discountCancelAmount")
        private Integer discountCancelAmount;

        @JsonProperty("discountRestAmount")
        private Integer discountRestAmount;

        @JsonProperty("taxScopeAmount")
        private Integer taxScopeAmount;

        @JsonProperty("taxExScopeAmount")
        private Integer taxExScopeAmount;

        @JsonProperty("taxScopeRestAmount")
        private Integer taxScopeRestAmount;

        @JsonProperty("taxExScopeRestAmount")
        private Integer taxExScopeRestAmount;

        @JsonProperty("environmentDepositAmount")
        private Integer environmentDepositAmount;

        @JsonProperty("environmentDepositRestAmount")
        private Integer environmentDepositRestAmount;

        @JsonProperty("cancelYmdt")
        private String cancelYmdt;

        @JsonProperty("totalRestAmount")
        private Integer totalRestAmount;

        @JsonProperty("applyRestAmount")
        private Integer applyRestAmount;
    }
}
