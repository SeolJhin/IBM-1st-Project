package org.myweb.uniplace.domain.user.api.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SocialLinkStartResponse {
    private String authorizationUrl;
}
