package org.myweb.uniplace.domain.payment.application.gateway.kakao.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

//PG 벤더 전용 DTO는 스펙(JSON 키) 그대로 두기 >> 카멜케이스 적용 안 함. 건들지 말 것.

@Getter
@Builder
public class KakaoReadyRequest {

    @JsonProperty("cid")
    private String cid;

    @JsonProperty("cid_secret")
    private String cid_secret;

    @JsonProperty("partner_order_id")
    private String partner_order_id;

    @JsonProperty("partner_user_id")
    private String partner_user_id;

    @JsonProperty("item_name")
    private String item_name;

    @JsonProperty("item_code")
    private String item_code; // optional

    @JsonProperty("quantity")
    private Integer quantity;

    @JsonProperty("total_amount")
    private Integer total_amount;

    @JsonProperty("tax_free_amount")
    private Integer tax_free_amount;

    @JsonProperty("vat_amount")
    private Integer vat_amount; // optional

    @JsonProperty("approval_url")
    private String approval_url;

    @JsonProperty("cancel_url")
    private String cancel_url;

    @JsonProperty("fail_url")
    private String fail_url;
}