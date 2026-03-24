package org.myweb.uniplace.domain.user.api;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import java.util.regex.Pattern;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
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

    private static final String GUEST_SID_COOKIE_NAME = "guest_sid";
    private static final int GUEST_SID_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
    private static final Pattern GUEST_SID_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{16,128}$");

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

    @PostMapping("/guest-token")
    public ApiResponse<UserTokenResponse> guestToken(HttpServletRequest http, HttpServletResponse response) {
        String guestSid = resolveOrCreateGuestSid(http);
        setGuestSidCookie(response, guestSid, isSecureRequest(http));
        String currentAccessToken = extractBearerToken(http.getHeader(HttpHeaders.AUTHORIZATION));
        return ApiResponse.ok(authService.issueGuestToken(guestSid, currentAccessToken));
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

    private String resolveOrCreateGuestSid(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (GUEST_SID_COOKIE_NAME.equals(cookie.getName())
                    && cookie.getValue() != null
                    && GUEST_SID_PATTERN.matcher(cookie.getValue().trim()).matches()) {
                    return cookie.getValue().trim();
                }
            }
        }
        return UUID.randomUUID().toString().replace("-", "");
    }

    private void setGuestSidCookie(HttpServletResponse response, String guestSid, boolean secure) {
        ResponseCookie cookie = ResponseCookie.from(GUEST_SID_COOKIE_NAME, guestSid)
            .httpOnly(true)
            .secure(secure)
            .path("/")
            .sameSite("Lax")
            .maxAge(GUEST_SID_MAX_AGE_SECONDS)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private boolean isSecureRequest(HttpServletRequest request) {
        if (request.isSecure()) {
            return true;
        }
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        return forwardedProto != null && "https".equalsIgnoreCase(forwardedProto.trim());
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return null;
        }
        return authorizationHeader.substring(7).trim();
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
