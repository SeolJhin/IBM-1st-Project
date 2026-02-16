package org.myweb.uniplace.domain.user.api.admin;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.application.AuthService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/users")
@PreAuthorize("hasRole('admin') or hasAuthority('ROLE_admin')") // 네 SecurityConfig/GrantedAuthority 규칙에 맞춰 1개로 정리
public class AdminUserController {

    private final AuthService authService;

    @PostMapping("/{userId}/logout-all")
    public ApiResponse<Void> logoutAll(@PathVariable String userId) {
        authService.logoutAll(userId);
        return ApiResponse.ok();
    }
}
