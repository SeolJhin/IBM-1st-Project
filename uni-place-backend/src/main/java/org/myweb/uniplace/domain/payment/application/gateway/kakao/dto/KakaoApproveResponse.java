package org.myweb.uniplace.domain.payment.application.gateway.kakao.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

//PG 벤더 전용 DTO는 스펙(JSON 키) 그대로 두기 >> 카멜케이스 적용 안 함. 건들지 말 것.

@Getter
public class KakaoApproveResponse {

    @JsonProperty("aid")
    private String aid;

    @JsonProperty("tid")
    private String tid;

    @JsonProperty("cid")
    private String cid;

    @JsonProperty("partner_order_id")
    private String partner_order_id;

    @JsonProperty("partner_user_id")
    private String partner_user_id;

    @JsonProperty("payment_method_type")
    private String payment_method_type;

    @JsonProperty("created_at")
    private String created_at;

    @JsonProperty("approved_at")
    private String approved_at;
}