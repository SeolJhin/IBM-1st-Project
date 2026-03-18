package org.myweb.uniplace.domain.user.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.api.dto.request.KakaoSignupCompleteRequest;
import org.myweb.uniplace.domain.user.api.dto.request.LogoutRequest;
import org.myweb.uniplace.domain.user.api.dto.request.RefreshTokenRequest;
import org.myweb.uniplace.domain.user.api.dto.request.SocialLinkStartRequest;
import org.myweb.uniplace.domain.user.api.dto.request.UserLoginRequest;
import org.myweb.uniplace.domain.user.api.dto.request.UserSignupRequest;
import org.myweb.uniplace.domain.user.api.dto.response.SocialLinkStartResponse;
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
import org.myweb.uniplace.domain.user.api.dto.request.FindEmailRequest;
import org.myweb.uniplace.domain.user.api.dto.request.PasswordResetRequest;
import org.myweb.uniplace.domain.user.api.dto.request.PasswordResetConfirmRequest;
import org.myweb.uniplace.domain.user.api.dto.request.EmailCodeRequest;
import org.myweb.uniplace.domain.user.api.dto.request.EmailCodeVerifyRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    // ─────────────────────────────────────────────
    // 이메일 인증코드 발송
    // ─────────────────────────────────────────────
    @PostMapping("/email/send-code")
    public ApiResponse<Void> sendEmailCode(@Valid @RequestBody EmailCodeRequest req) {
        authService.sendEmailCode(req.getUserEmail());
        return ApiResponse.ok();
    }

    // ─────────────────────────────────────────────
    // 이메일 인증코드 검증
    // ─────────────────────────────────────────────
    @PostMapping("/email/verify-code")
    public ApiResponse<Void> verifyEmailCode(@Valid @RequestBody EmailCodeVerifyRequest req) {
        authService.verifyEmailCode(req.getUserEmail(), req.getCode());
        return ApiResponse.ok();
    }

    @PostMapping("/signup")
    public ApiResponse<Void> signup(@Valid @RequestBody UserSignupRequest req) {
        authService.signup(req);
        return ApiResponse.ok();
    }

    @GetMapping("/check-nickname")
    public ApiResponse<Boolean> checkNickname(@RequestParam("nickname") String nickname) {
        return ApiResponse.ok(authService.checkNicknameAvailable(nickname));
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

    @PostMapping("/oauth2/google/complete")
    public ApiResponse<UserTokenResponse> googleComplete(
        HttpServletRequest http,
        @Valid @RequestBody KakaoSignupCompleteRequest req
    ) {
        return ApiResponse.ok(authService.googleComplete(req, http.getHeader("User-Agent"), extractIp(http)));
    }

    @PostMapping("/oauth2/link/start")
    public ApiResponse<SocialLinkStartResponse> startSocialLink(
        @AuthenticationPrincipal AuthUser me,
        @Valid @RequestBody SocialLinkStartRequest req
    ) {
        if (me == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return ApiResponse.ok(authService.startSocialLink(me.getUserId(), req));
    }

    private String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
    
    // ─────────────────────────────────────────────
    // 아이디(이메일) 찾기
    // ─────────────────────────────────────────────
    @PostMapping("/find-email")
    public ApiResponse<String> findEmail(@Valid @RequestBody FindEmailRequest req) {
        return ApiResponse.ok(authService.findEmail(req));
    }

    // ─────────────────────────────────────────────
    // 비밀번호 재설정 요청 (메일 발송)
    // ─────────────────────────────────────────────
    @PostMapping("/reset-password/request")
    public ApiResponse<Void> requestPasswordReset(@Valid @RequestBody PasswordResetRequest req) {
        authService.requestPasswordReset(req);
        return ApiResponse.ok();
    }

    // ─────────────────────────────────────────────
    // 토큰 유효성 사전 확인 (페이지 진입 시)
    // ─────────────────────────────────────────────
    @GetMapping("/reset-password/verify")
    public ApiResponse<Void> verifyPasswordResetToken(@RequestParam("token") String token) {
        authService.verifyPasswordResetToken(token);
        return ApiResponse.ok();
    }
    // ─────────────────────────────────────────────
    // 비밀번호 재설정 확정
    // ─────────────────────────────────────────────
    @PostMapping("/reset-password/confirm")
    public ApiResponse<Void> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest req) {
        authService.confirmPasswordReset(req);
        return ApiResponse.ok();
    }

}
