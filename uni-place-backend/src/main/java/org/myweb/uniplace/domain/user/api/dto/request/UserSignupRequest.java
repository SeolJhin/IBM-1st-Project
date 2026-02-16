package org.myweb.uniplace.domain.user.api.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UserSignupRequest {
    private String userNm;
    private String userEmail;
    private String userPwd;
    private LocalDate userBirth;
    private String userTel;
}
