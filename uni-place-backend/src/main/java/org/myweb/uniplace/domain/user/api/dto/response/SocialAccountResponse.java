package org.myweb.uniplace.domain.user.api.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.user.domain.entity.SocialAccount;

@Getter
@Builder
public class SocialAccountResponse {
    private String provider;
    private String providerEmail;
    private LocalDateTime linkedAt;

    public static SocialAccountResponse from(SocialAccount socialAccount) {
        return SocialAccountResponse.builder()
            .provider(socialAccount.getProvider())
            .providerEmail(socialAccount.getProviderEmail())
            .linkedAt(socialAccount.getCreatedAt())
            .build();
    }
}
