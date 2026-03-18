package org.myweb.uniplace.domain.user.api;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.api.dto.request.SocialLinkUnlinkRequest;
import org.myweb.uniplace.domain.user.api.dto.request.UserUpdateRequest;
import org.myweb.uniplace.domain.user.api.dto.response.SocialAccountResponse;
import org.myweb.uniplace.domain.user.api.dto.response.UserResponse;
import org.myweb.uniplace.domain.user.application.UserService;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.security.AuthUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import jakarta.validation.Valid;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal AuthUser me) {
        if (me == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return ApiResponse.ok(userService.me(me.getUserId()));
    }

    @GetMapping("/me/social-accounts")
    public ApiResponse<List<SocialAccountResponse>> mySocialAccounts(@AuthenticationPrincipal AuthUser me) {
        if (me == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return ApiResponse.ok(userService.mySocialAccounts(me.getUserId()));
    }

    @PostMapping("/me/social-accounts/unlink")
    public ApiResponse<Void> unlinkSocialAccount(
        @AuthenticationPrincipal AuthUser me,
        @Valid @RequestBody SocialLinkUnlinkRequest req
    ) {
        if (me == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        userService.unlinkSocialAccount(me.getUserId(), req);
        return ApiResponse.ok();
    }

    @PatchMapping("/me")
    public ApiResponse<UserResponse> updateMe(
            @AuthenticationPrincipal AuthUser me,
            @Valid @RequestBody UserUpdateRequest req
    ) {
        if (me == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return ApiResponse.ok(userService.updateMe(me.getUserId(), req));
    }

    @DeleteMapping("/me")
    public ApiResponse<Void> deleteMe(@AuthenticationPrincipal AuthUser me) {
        if (me == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        userService.deleteMe(me.getUserId());
        return ApiResponse.ok();
    }
}
