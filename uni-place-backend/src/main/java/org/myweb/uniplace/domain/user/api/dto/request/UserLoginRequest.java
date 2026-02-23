package org.myweb.uniplace.domain.user.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserLoginRequest {

    @NotBlank(message = "userEmail is required")
    @Email(message = "userEmail format is invalid")
    private String userEmail;

    @NotBlank(message = "userPwd is required")
    private String userPwd;

    // Optional: if omitted, server generates a device id.
    private String deviceId;
}
