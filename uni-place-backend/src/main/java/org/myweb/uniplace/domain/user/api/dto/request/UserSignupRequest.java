package org.myweb.uniplace.domain.user.api.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter @Setter
public class UserSignupRequest {
    private String userName;
    private String userEmail;
    private String userPwd;     // 평문 입력(저장할 때 해시로 바꿔서 user_pwd에 저장)
    private LocalDate userBirth;
    private String userTel;
}
