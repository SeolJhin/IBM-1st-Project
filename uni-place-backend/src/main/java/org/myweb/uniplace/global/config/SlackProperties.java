// 경로: org/myweb/uniplace/global/config/SlackProperties.java
package org.myweb.uniplace.global.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Getter
@Component
public class SlackProperties {

    /** Slack Incoming Webhook URL (application.properties에서 주입) */
    @Value("${slack.webhook-url:}")
    private String webhookUrl;
}
