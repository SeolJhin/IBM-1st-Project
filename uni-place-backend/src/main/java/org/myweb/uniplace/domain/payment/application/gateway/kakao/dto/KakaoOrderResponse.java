package org.myweb.uniplace.domain.payment.application.gateway.kakao.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class KakaoOrderResponse {

    @JsonProperty("tid")
    private String tid;

    @JsonProperty("status")
    private String status;

    @JsonProperty("partner_order_id")
    private String partnerOrderId;

    @JsonProperty("amount")
    private Amount amount;

    @Getter
    public static class Amount {
        @JsonProperty("total")
        private Integer total;
    }
}
