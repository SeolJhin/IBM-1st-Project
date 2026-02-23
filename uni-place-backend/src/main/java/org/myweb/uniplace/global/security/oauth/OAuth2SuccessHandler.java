package org.myweb.uniplace.global.security.oauth;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.domain.entity.RefreshToken;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.repository.RefreshTokenRepository;
import org.myweb.uniplace.global.security.JwtProvider;
import org.myweb.uniplace.global.util.IdGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.oauth2.redirect-uri:http://localhost:3000/oauth2/success}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request,
        HttpServletResponse response,
        Authentication authentication
    ) throws IOException, ServletException {
        UserContext userContext = (UserContext) authentication.getPrincipal();

        if (userContext.isSignupRequired()) {
            handleSignupPending(response, userContext);
            return;
        }

        User user = userContext.getUser();
        if (user == null || !hasText(user.getUserId())) {
            response.sendRedirect(redirectUri + "#error=oauth_user_not_found");
            return;
        }
        if (!user.canLogin()) {
            response.sendRedirect(redirectUri + "#error=oauth_user_blocked");
            return;
        }

        String accessToken = jwtProvider.createAccessToken(user.getUserId(), user.getUserRole().name());
        String refreshToken = jwtProvider.createRefreshToken(user.getUserId());
        String deviceId = resolveDeviceId(userContext);

        persistRefreshToken(user, refreshToken, deviceId, request);

        String redirectUrl = redirectUri
            + "#accessToken=" + enc(accessToken)
            + "&refreshToken=" + enc(refreshToken)
            + "&deviceId=" + enc(deviceId)
            + "&additionalInfoRequired=" + user.isAdditionalInfoRequired();
        response.sendRedirect(redirectUrl);
    }

    private void handleSignupPending(HttpServletResponse response, UserContext userContext) throws IOException {
        if (!hasText(userContext.getProvider()) || !hasText(userContext.getProviderId())) {
            response.sendRedirect(redirectUri + "#error=oauth_profile_invalid");
            return;
        }

        String signupToken = jwtProvider.createOauthSignupToken(
            userContext.getProvider().toLowerCase(),
            userContext.getProviderId(),
            userContext.getEmail(),
            userContext.getNickname()
        );

        String redirectUrl = redirectUri
            + "#signupToken=" + enc(signupToken)
            + "&provider=" + enc(userContext.getProvider().toLowerCase());
        response.sendRedirect(redirectUrl);
    }

    private void persistRefreshToken(User user, String refreshToken, String deviceId, HttpServletRequest request) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(jwtProvider.getRefreshExpMs() / 1000);

        RefreshToken rt = RefreshToken.builder()
            .refreshTokenId(IdGenerator.generate("RTK"))
            .user(user)
            .tokenHash(sha256Hex(refreshToken))
            .deviceId(deviceId)
            .userAgent(request.getHeader("User-Agent"))
            .ip(extractIp(request))
            .expiresAt(expiresAt)
            .revoked(false)
            .lastUsedAt(now)
            .build();

        refreshTokenRepository.save(rt);
    }

    private static String resolveDeviceId(UserContext userContext) {
        if (hasText(userContext.getProvider())) {
            return "OAUTH_" + userContext.getProvider().toUpperCase();
        }
        return "OAUTH";
    }

    private static String enc(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    private static String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (hasText(xff)) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static String sha256Hex(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digested = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digested);
        } catch (Exception e) {
            throw new IllegalStateException("sha256 failed", e);
        }
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
