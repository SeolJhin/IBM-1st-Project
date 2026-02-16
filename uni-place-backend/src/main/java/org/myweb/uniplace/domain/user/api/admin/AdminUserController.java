package org.myweb.uniplace.domain.user.api.admin;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.api.dto.request.AdminUserUpdateRequest;
import org.myweb.uniplace.domain.user.api.dto.response.UserResponse;
import org.myweb.uniplace.domain.user.application.AdminUserService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/users")
@PreAuthorize("hasAuthority('admin') or hasRole('admin')") // 너 SecurityConfig 규칙에 맞춰 한쪽으로 정리
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping("/{userId}")
    public ApiResponse<UserResponse> get(@PathVariable String userId) {
        return ApiResponse.ok(adminUserService.getUser(userId));
    }

    @PatchMapping("/{userId}")
    public ApiResponse<UserResponse> update(@PathVariable String userId, @RequestBody AdminUserUpdateRequest req) {
        return ApiResponse.ok(adminUserService.updateUser(userId, req));
    }
}
