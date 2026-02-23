package org.myweb.uniplace.domain.user.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.api.dto.request.KakaoSignupCompleteRequest;
import org.myweb.uniplace.domain.user.api.dto.request.LogoutRequest;
import org.myweb.uniplace.domain.user.api.dto.request.RefreshTokenRequest;
import org.myweb.uniplace.domain.user.api.dto.request.UserLoginRequest;
import org.myweb.uniplace.domain.user.api.dto.request.UserSignupRequest;
import org.myweb.uniplace.domain.user.api.dto.response.UserTokenResponse;
import org.myweb.uniplace.domain.user.application.AuthService;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.security.AuthUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ApiResponse<Void> signup(@Valid @RequestBody UserSignupRequest req) {
        authService.signup(req);
        return ApiResponse.ok();
    }

    @PostMapping("/login")
    public ApiResponse<UserTokenResponse> login(HttpServletRequest http, @Valid @RequestBody UserLoginRequest req) {
        return ApiResponse.ok(authService.login(req, http.getHeader("User-Agent"), extractIp(http)));
    }

    @PostMapping("/refresh")
    public ApiResponse<UserTokenResponse> refresh(HttpServletRequest http, @Valid @RequestBody RefreshTokenRequest req) {
        return ApiResponse.ok(authService.refresh(req, http.getHeader("User-Agent"), extractIp(http)));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@Valid @RequestBody LogoutRequest req) {
        authService.logout(req);
        return ApiResponse.ok();
    }

    @PostMapping("/logout-all")
    public ApiResponse<Void> logoutAll(@AuthenticationPrincipal AuthUser me) {
        if (me == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        authService.logoutAll(me.getUserId());
        return ApiResponse.ok();
    }

    @PostMapping("/oauth2/kakao/complete")
    public ApiResponse<UserTokenResponse> kakaoComplete(
        HttpServletRequest http,
        @Valid @RequestBody KakaoSignupCompleteRequest req
    ) {
        return ApiResponse.ok(authService.kakaoComplete(req, http.getHeader("User-Agent"), extractIp(http)));
    }

    private String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
