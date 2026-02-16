package org.myweb.uniplace.domain.user.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class UserSignupRequest {
    @NotBlank @Size(max=50)
    private String userId;

    @NotBlank @Size(max=50)
    private String userName;

    @NotBlank @Email @Size(max=100)
    private String userEmail;

    @NotBlank @Size(min=8, max=60)
    private String userPwd;

    @NotNull
    private LocalDate userBirth;

    @NotBlank @Size(max=20)
    private String userTel;
}
