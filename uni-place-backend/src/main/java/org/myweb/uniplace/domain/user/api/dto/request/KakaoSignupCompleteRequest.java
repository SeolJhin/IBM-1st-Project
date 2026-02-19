package org.myweb.uniplace.domain.user.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class KakaoSignupCompleteRequest {

    @NotBlank(message = "signupToken은 필수입니다.")
    private String signupToken;

    @NotBlank(message = "이름(userNm)은 필수입니다.")
    private String userNm;

    @NotNull(message = "생년월일(userBirth)는 필수입니다.")
    private LocalDate userBirth;

    @NotBlank(message = "전화번호(userTel)는 필수입니다.")
    private String userTel;
}
