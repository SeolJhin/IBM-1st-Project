package org.myweb.uniplace.domain.user.api.admin.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import org.myweb.uniplace.domain.user.domain.enums.UserRole;

@Getter
public class AdminUserRoleUpdateRequest {

    @NotNull(message = "변경할 회원 권한은 필수입니다.")
    private UserRole userRole;
}
