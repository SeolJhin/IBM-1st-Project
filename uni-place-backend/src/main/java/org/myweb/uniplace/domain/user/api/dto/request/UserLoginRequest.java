package org.myweb.uniplace.domain.user.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UserLoginRequest {
	@NotBlank(message = "이메일(userEmail)은 필수입니다.")
    private String userEmail;
	
	@NotBlank(message = "비밀번호(userPwd)는 필수입니다.")
    private String userPwd;
	
    private String deviceId; // 없으면 서버가 생성
}
