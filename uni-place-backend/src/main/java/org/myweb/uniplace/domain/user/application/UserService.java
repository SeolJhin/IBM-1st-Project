package org.myweb.uniplace.domain.user.application;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.myweb.uniplace.domain.user.api.admin.dto.request.AdminUserRoleUpdateRequest;
import org.myweb.uniplace.domain.user.api.admin.dto.request.AdminUserStatusUpdateRequest;
import org.myweb.uniplace.domain.user.api.dto.request.SocialLinkUnlinkRequest;
import org.myweb.uniplace.domain.user.api.dto.response.SocialAccountResponse;
import org.myweb.uniplace.domain.user.api.dto.request.UserUpdateRequest;
import org.myweb.uniplace.domain.user.api.dto.response.UserResponse;
import org.myweb.uniplace.domain.user.domain.enums.UserRole;
import java.util.List;

public interface UserService {
    UserResponse me(String userId);
    List<SocialAccountResponse> mySocialAccounts(String userId);
    void unlinkSocialAccount(String userId, SocialLinkUnlinkRequest req);
    UserResponse updateMe(String userId, UserUpdateRequest req);
    UserResponse getByIdForAdmin(String userId);
    
    Page<UserResponse> listForAdmin(Pageable pageable, UserRole role);
    //  관리자 - 상태 변경
    UserResponse updateStatus(String userId, AdminUserStatusUpdateRequest req);

    //  관리자 - 권한 변경
    UserResponse updateRole(String userId, AdminUserRoleUpdateRequest req);
    
    void deleteMe(String userId);
}
