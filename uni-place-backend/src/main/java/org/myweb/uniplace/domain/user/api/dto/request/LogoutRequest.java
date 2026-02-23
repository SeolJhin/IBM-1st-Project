package org.myweb.uniplace.domain.user.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LogoutRequest {

    @NotBlank(message = "refreshToken is required")
    private String refreshToken;

    // Backward compatible field (not required)
    private String deviceId;
}
