package org.myweb.uniplace.domain.user.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.api.dto.request.*;
import org.myweb.uniplace.domain.user.api.dto.response.UserTokenResponse;
import org.myweb.uniplace.domain.user.application.AuthService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

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
    
    // ✅ 카카오 소셜 로그인 후 "추가정보 입력 완료" 시점에 진짜 회원 생성 + 토큰 발급
    @PostMapping("/oauth2/kakao/complete")
    public ApiResponse<UserTokenResponse> kakaoComplete(
            HttpServletRequest http,
            @Valid @RequestBody KakaoSignupCompleteRequest req
    ) {
        return ApiResponse.ok(authService.kakaoComplete(req, http.getHeader("User-Agent"), extractIp(http)));
    }


    private String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
