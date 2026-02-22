package org.myweb.uniplace.domain.payment.application.gateway.naver;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(NaverPayProperties.class)
public class NaverPayConfig {
}
