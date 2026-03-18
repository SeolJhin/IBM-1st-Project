package org.myweb.uniplace.domain.user.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SocialLinkUnlinkRequest {

    @NotBlank(message = "provider is required")
    private String provider;

    @NotBlank(message = "currentUserPwd is required")
    private String currentUserPwd;
}
