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

    private String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
