package org.myweb.uniplace.domain.payment.application.gateway.kakao;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "payment.kakao")
public class KakaoPayProperties {

    private String base_url;     // ex) https://open-api.kakaopay.com
    private String secret_key;   // SECRET KEY
    private String cid;          // ex) TC0ONETIME
    private String cid_secret;   
}