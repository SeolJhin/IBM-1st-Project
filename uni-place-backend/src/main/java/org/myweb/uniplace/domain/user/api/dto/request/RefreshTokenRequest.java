package org.myweb.uniplace.domain.user.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RefreshTokenRequest {

    @NotBlank(message = "refreshToken is required")
    private String refreshToken;

    // Optional extra check value
    private String deviceId;
}
