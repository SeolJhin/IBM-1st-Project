package org.myweb.uniplace.domain.payment.application.gateway.kakao.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

// PG 벤더 전용 DTO는 스펙(JSON 키) 그대로 두기 >> 카멜케이스 적용 안 함. 건들지 말 것.

@Getter
@Builder
public class KakaoApproveRequest {

    @JsonProperty("cid")
    private String cid;

    @JsonProperty("cid_secret")
    private String cid_secret;

    @JsonProperty("tid")
    private String tid;

    @JsonProperty("partner_order_id")
    private String partner_order_id;

    @JsonProperty("partner_user_id")
    private String partner_user_id;

    @JsonProperty("pg_token")
    private String pg_token;

    @JsonProperty("payload")
    private String payload; // optional
}