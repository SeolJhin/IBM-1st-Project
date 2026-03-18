package org.myweb.uniplace.domain.payment.application.gateway.toss.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class TossReadyResponse {

    @JsonProperty("paymentKey")
    private String paymentKey;

    @JsonProperty("orderId")
    private String orderId;

    @JsonProperty("checkout")
    private Checkout checkout;

    @Getter
    public static class Checkout {
        @JsonProperty("url")
        private String url;
    }
}
