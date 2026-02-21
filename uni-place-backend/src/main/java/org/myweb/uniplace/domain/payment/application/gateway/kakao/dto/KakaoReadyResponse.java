package org.myweb.uniplace.domain.payment.application.gateway.kakao.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

//PG 벤더 전용 DTO는 스펙(JSON 키) 그대로 두기 >> 카멜케이스 적용 안 함. 건들지 말 것.

@Getter
public class KakaoReadyResponse {

    @JsonProperty("tid")
    private String tid;

    @JsonProperty("next_redirect_app_url")
    private String next_redirect_app_url;

    @JsonProperty("next_redirect_mobile_url")
    private String next_redirect_mobile_url;

    @JsonProperty("next_redirect_pc_url")
    private String next_redirect_pc_url;

    @JsonProperty("created_at")
    private String created_at;
}