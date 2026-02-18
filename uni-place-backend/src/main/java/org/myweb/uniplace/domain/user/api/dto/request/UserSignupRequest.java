package org.myweb.uniplace.domain.user.api.dto.request;

import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Getter
@Setter
public class UserSignupRequest {
	@NotBlank(message = "이름(userNm)은 필수입니다.")
    private String userNm;
	
	@NotBlank(message = "이메일(userEmail)은 필수입니다.")
    @Email(message = "이메일(userEmail) 형식이 올바르지 않습니다.")
    private String userEmail;
	
	@NotBlank(message = "비밀번호(userPwd)는 필수입니다.")
    private String userPwd;
	
	@NotNull(message = "생년월일(userBirth)는 필수입니다.")
    private LocalDate userBirth;
	
	@NotBlank(message = "전화번호(userTel)는 필수입니다.")
    private String userTel;
}
