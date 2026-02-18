package org.myweb.uniplace.domain.user.api.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UserUpdateRequest {
    private String userTel;
    private String userPwd;
}
