package org.myweb.uniplace.domain.user.application;

import org.myweb.uniplace.domain.user.api.admin.dto.request.AdminUserRoleUpdateRequest;
import org.myweb.uniplace.domain.user.api.admin.dto.request.AdminUserStatusUpdateRequest;
import org.myweb.uniplace.domain.user.api.dto.request.UserUpdateRequest;
import org.myweb.uniplace.domain.user.api.dto.response.UserResponse;

public interface UserService {
    UserResponse me(String userId);
    UserResponse updateMe(String userId, UserUpdateRequest req);
    UserResponse getByIdForAdmin(String userId);
    
    // ✅ 관리자 - 상태 변경
    UserResponse updateStatus(String userId, AdminUserStatusUpdateRequest req);

    // ✅ 관리자 - 권한 변경
    UserResponse updateRole(String userId, AdminUserRoleUpdateRequest req);
    
    void deleteMe(String userId);
}
