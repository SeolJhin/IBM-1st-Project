package org.myweb.uniplace.domain.user.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UserUpdateRequest {
	@Email(message = "이메일(userEmail) 형식이 올바르지 않습니다.")
    private String userEmail;
	
    private String userTel;
    
    @Size(min = 8, message = "비밀번호(userPwd)는 최소 8자 이상이어야 합니다.")
    private String userPwd;
}
