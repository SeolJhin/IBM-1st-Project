package org.myweb.uniplace.domain.user.api.admin;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.api.dto.response.UserResponse;
import org.myweb.uniplace.domain.user.application.UserService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/users")
public class AdminUserController {

    private final UserService userService;

    // 예: 관리자 - 단건 조회(필요하면 UserService에 메서드 추가)
    @GetMapping("/{userId}")
    public ApiResponse<UserResponse> get(@PathVariable String userId) {
        return ApiResponse.ok(userService.getByIdForAdmin(userId));
    }
}
