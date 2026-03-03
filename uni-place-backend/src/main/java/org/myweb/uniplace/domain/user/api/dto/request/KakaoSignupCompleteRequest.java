package org.myweb.uniplace.domain.user.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class KakaoSignupCompleteRequest {

    @NotBlank(message = "signupToken is required")
    private String signupToken;

    @NotBlank(message = "닉네임(userNickname)은 필수입니다.")
    @Size(min = 2, max = 20, message = "닉네임은 2자 이상 20자 이하여야 합니다.")
    private String userNickname;

    @NotBlank(message = "userNm is required")
    private String userNm;

    @NotNull(message = "userBirth is required")
    private LocalDate userBirth;

    @NotBlank(message = "userTel is required")
    private String userTel;

    @NotBlank(message = "userPwd is required")
    @Size(min = 8, message = "userPwd must be at least 8 characters")
    private String userPwd;
}