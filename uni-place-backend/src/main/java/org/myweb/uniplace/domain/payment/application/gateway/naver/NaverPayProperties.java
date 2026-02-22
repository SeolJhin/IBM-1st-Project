package org.myweb.uniplace.domain.payment.application.gateway.naver;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "payment.naver")
public class NaverPayProperties {

    // ex) https://dev-pay.paygate.naver.com
    private String api_base_url;

    // ex) https://test-m.pay.naver.com
    private String service_base_url;

    // ex) v2.2
    private String api_version;

    // ex) naverpay-partner
    private String partner_id;

    private String client_id;
    private String client_secret;

    // optional
    private String chain_id;
}
