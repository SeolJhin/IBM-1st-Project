package org.myweb.uniplace.domain.user.api.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UserLoginRequest {
    private String userEmail;
    private String userPwd;
    private String deviceId; // 없으면 서버가 생성
}
