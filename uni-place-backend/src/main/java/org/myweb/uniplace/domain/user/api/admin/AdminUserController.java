package org.myweb.uniplace.domain.user.api.admin;

import org.myweb.uniplace.domain.user.api.admin.dto.request.AdminUserRoleUpdateRequest;
import org.myweb.uniplace.domain.user.api.admin.dto.request.AdminUserStatusUpdateRequest;
import org.myweb.uniplace.domain.user.api.dto.response.UserResponse;
import org.myweb.uniplace.domain.user.application.UserService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/users")
public class AdminUserController {

    private final UserService userService;

    // 예: 관리자 - 단건 조회(필요하면 UserService에 메서드 추가)
    @GetMapping("/{userId}")
    public ApiResponse<UserResponse> get(@PathVariable("userId") String userId) {
        return ApiResponse.ok(userService.getByIdForAdmin(userId));
    }
    
    // 🔥 관리자 - 회원 상태 변경
    @PatchMapping("/{userId}/status")
    public ApiResponse<UserResponse> updateStatus(
            @PathVariable("userId") String userId,
            @Valid @RequestBody AdminUserStatusUpdateRequest req
    ) {
        return ApiResponse.ok(userService.updateStatus(userId, req));
    }

    // 🔥 관리자 - 회원 권한 변경
    @PatchMapping("/{userId}/role")
    public ApiResponse<UserResponse> updateRole(
            @PathVariable("userId") String userId,
            @Valid @RequestBody AdminUserRoleUpdateRequest req
    ) {
        return ApiResponse.ok(userService.updateRole(userId, req));
    }
}










