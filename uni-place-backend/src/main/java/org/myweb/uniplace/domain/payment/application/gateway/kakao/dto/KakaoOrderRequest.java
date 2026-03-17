package org.myweb.uniplace.domain.payment.application.gateway.kakao.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class KakaoOrderRequest {

    private String cid;
    private String cid_secret;
    private String tid;
}
