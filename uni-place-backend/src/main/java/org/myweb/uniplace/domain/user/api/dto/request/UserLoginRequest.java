package org.myweb.uniplace.domain.user.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;

@Getter
public class UserLoginRequest {
    @NotBlank @Email
    private String userEmail;

    @NotBlank
    private String userPwd;
}
