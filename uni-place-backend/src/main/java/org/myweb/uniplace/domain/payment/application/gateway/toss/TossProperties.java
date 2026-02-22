package org.myweb.uniplace.domain.payment.application.gateway.toss;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "payment.toss")
public class TossProperties {

    // ex) https://api.tosspayments.com
    private String api_base_url;

    // secret key (for Basic auth)
    private String secret_key;

    // webhook secret (optional)
    private String webhook_secret;
}
