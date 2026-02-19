package org.myweb.uniplace.domain.user.api.admin.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import org.myweb.uniplace.domain.user.domain.enums.UserStatus;

@Getter
public class AdminUserStatusUpdateRequest {

    @NotNull(message = "변경할 회원 상태는 필수입니다.")
    private UserStatus userStatus;

    public UserStatus getUserSt() {
        return userStatus;
    }
}
