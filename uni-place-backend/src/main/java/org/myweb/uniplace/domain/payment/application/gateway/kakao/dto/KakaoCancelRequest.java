package org.myweb.uniplace.domain.payment.application.gateway.kakao.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class KakaoCancelRequest {

    @JsonProperty("cid")
    private String cid;

    @JsonProperty("cid_secret")
    private String cid_secret;

    @JsonProperty("tid")
    private String tid;

    @JsonProperty("cancel_amount")
    private Integer cancel_amount;

    @JsonProperty("cancel_tax_free_amount")
    private Integer cancel_tax_free_amount;

    @JsonProperty("cancel_vat_amount")
    private Integer cancel_vat_amount; // optional

    @JsonProperty("cancel_available_amount")
    private Integer cancel_available_amount; // optional

    @JsonProperty("payload")
    private String payload; // optional
}
