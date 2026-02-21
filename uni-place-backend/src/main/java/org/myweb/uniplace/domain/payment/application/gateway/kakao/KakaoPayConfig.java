package org.myweb.uniplace.domain.payment.application.gateway.kakao;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(KakaoPayProperties.class)
public class KakaoPayConfig {
}