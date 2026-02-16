package org.myweb.uniplace.domain.user.api;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.api.dto.request.UserUpdateRequest;
import org.myweb.uniplace.domain.user.api.dto.response.UserResponse;
import org.myweb.uniplace.domain.user.application.UserService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.myweb.uniplace.global.security.AuthUser;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal AuthUser me) {
        return ApiResponse.ok(userService.me(me.getUserId()));
    }

    @PatchMapping("/me")
    public ApiResponse<UserResponse> updateMe(
            @AuthenticationPrincipal AuthUser me,
            @RequestBody UserUpdateRequest req
    ) {
        return ApiResponse.ok(userService.updateMe(me.getUserId(), req));
    }

    @DeleteMapping("/me")
    public ApiResponse<Void> deleteMe(@AuthenticationPrincipal AuthUser me) {
        userService.softDeleteMe(me.getUserId());
        return ApiResponse.ok();
    }
}
