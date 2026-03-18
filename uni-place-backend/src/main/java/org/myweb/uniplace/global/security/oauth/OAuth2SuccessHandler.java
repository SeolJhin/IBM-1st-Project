package org.myweb.uniplace.global.security.oauth;

import io.jsonwebtoken.Claims;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.domain.entity.RefreshToken;
import org.myweb.uniplace.domain.user.domain.entity.SocialAccount;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.repository.RefreshTokenRepository;
import org.myweb.uniplace.domain.user.repository.SocialAccountRepository;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.security.JwtProvider;
import org.myweb.uniplace.global.util.IdGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private static final String LINK_STATE_PREFIX = "link.";

    private final JwtProvider jwtProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final SocialAccountRepository socialAccountRepository;

    @Value("${app.oauth2.redirect-uri:}")
    private String redirectUri;

    @Value("${app.frontend-url:}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request,
        HttpServletResponse response,
        Authentication authentication
    ) throws IOException, ServletException {
        UserContext userContext = (UserContext) authentication.getPrincipal();

        LinkState linkState = parseLinkState(request.getParameter("state"));
        if (linkState != null) {
            handleLinkFlow(request, response, userContext, linkState);
            return;
        }

        String resolvedRedirectUri = resolveRedirectUri(request);
        if (userContext.isSignupRequired()) {
            handleSignupPending(response, userContext, resolvedRedirectUri);
            return;
        }

        User user = userContext.getUser();
        if (user == null || !hasText(user.getUserId())) {
            response.sendRedirect(resolvedRedirectUri + "#error=oauth_user_not_found");
            return;
        }
        if (!user.canLogin()) {
            response.sendRedirect(resolvedRedirectUri + "#error=oauth_user_blocked");
            return;
        }

        String accessToken = jwtProvider.createAccessToken(user.getUserId(), user.getUserRole().name());
        String refreshToken = jwtProvider.createRefreshToken(user.getUserId());
        String deviceId = resolveDeviceId(userContext);

        persistRefreshToken(user, refreshToken, deviceId, request);

        String redirectUrl = resolvedRedirectUri
            + "#accessToken=" + enc(accessToken)
            + "&refreshToken=" + enc(refreshToken)
            + "&deviceId=" + enc(deviceId)
            + "&additionalInfoRequired=" + user.isAdditionalInfoRequired();
        response.sendRedirect(redirectUrl);
    }

    private void handleLinkFlow(
        HttpServletRequest request,
        HttpServletResponse response,
        UserContext userContext,
        LinkState linkState
    ) throws IOException {
        String returnTo = sanitizeReturnPath(linkState.returnTo());
        String provider = safeLower(userContext.getProvider());
        String providerId = userContext.getProviderId();

        if (!hasText(linkState.linkToken())) {
            response.sendRedirect(buildFrontendUrl(request, appendQuery(returnTo, "linkError", "token_missing")));
            return;
        }
        if (!hasText(provider) || !hasText(providerId)) {
            response.sendRedirect(buildFrontendUrl(request, appendQuery(returnTo, "linkError", "profile_invalid")));
            return;
        }

        try {
            Claims claims = jwtProvider.validateOauthLinkToken(linkState.linkToken());
            String userId = String.valueOf(claims.get("userId"));
            String expectedProvider = safeLower(String.valueOf(claims.get("provider")));
            if (!provider.equals(expectedProvider)) {
                response.sendRedirect(buildFrontendUrl(request, appendQuery(returnTo, "linkError", "provider_mismatch")));
                return;
            }

            User target = userRepository.findById(userId).orElse(null);
            if (target == null || !target.canLogin()) {
                response.sendRedirect(buildFrontendUrl(request, appendQuery(returnTo, "linkError", "target_user_invalid")));
                return;
            }

            String providerUpper = provider.toUpperCase();
            SocialAccount existing = socialAccountRepository
                .findByProviderAndProviderUserId(providerUpper, providerId)
                .orElse(null);

            if (existing != null) {
                if (!target.getUserId().equals(existing.getUser().getUserId())) {
                    response.sendRedirect(buildFrontendUrl(request, appendQuery(returnTo, "linkError", "already_linked_other_user")));
                    return;
                }
                response.sendRedirect(buildFrontendUrl(request, ensureLinkedQuery(returnTo, provider)));
                return;
            }

            SocialAccount linked = SocialAccount.builder()
                .user(target)
                .provider(providerUpper)
                .providerUserId(providerId)
                .providerEmail(userContext.getEmail())
                .build();
            socialAccountRepository.save(linked);

            response.sendRedirect(buildFrontendUrl(request, ensureLinkedQuery(returnTo, provider)));
        } catch (Exception e) {
            response.sendRedirect(buildFrontendUrl(request, appendQuery(returnTo, "linkError", "link_failed")));
        }
    }

    private void handleSignupPending(
        HttpServletResponse response,
        UserContext userContext,
        String resolvedRedirectUri
    ) throws IOException {
        if (!hasText(userContext.getProvider()) || !hasText(userContext.getProviderId())) {
            response.sendRedirect(resolvedRedirectUri + "#error=oauth_profile_invalid");
            return;
        }

        String signupToken = jwtProvider.createOauthSignupToken(
            userContext.getProvider().toLowerCase(),
            userContext.getProviderId(),
            userContext.getEmail(),
            userContext.getNickname()
        );

        String redirectUrl = resolvedRedirectUri
            + "#signupToken=" + enc(signupToken)
            + "&provider=" + enc(userContext.getProvider().toLowerCase());
        response.sendRedirect(redirectUrl);
    }

    private String ensureLinkedQuery(String path, String provider) {
        if (path.contains("linked=")) {
            return path;
        }
        return appendQuery(path, "linked", provider);
    }

    private String appendQuery(String path, String key, String value) {
        String delimiter = path.contains("?") ? "&" : "?";
        return path + delimiter + key + "=" + enc(value);
    }

    private String sanitizeReturnPath(String returnTo) {
        if (!hasText(returnTo)) {
            return "/me?tab=me";
        }
        String trimmed = returnTo.trim();
        if (!trimmed.startsWith("/")) {
            return "/me?tab=me";
        }
        return trimmed;
    }

    private String buildFrontendUrl(HttpServletRequest request, String path) {
        String base = frontendUrl;
        if (!hasText(base)) {
            base = resolveRequestOrigin(request);
        }
        String normalized = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        return normalized + path;
    }

    private static LinkState parseLinkState(String state) {
        if (!hasText(state) || !state.startsWith(LINK_STATE_PREFIX)) {
            return null;
        }
        int separator = state.indexOf('.', LINK_STATE_PREFIX.length());
        if (separator < 0) {
            return null;
        }

        String payload = state.substring(LINK_STATE_PREFIX.length(), separator);
        if (!hasText(payload)) {
            return null;
        }

        try {
            byte[] decoded = Base64.getUrlDecoder().decode(payload);
            String raw = new String(decoded, StandardCharsets.UTF_8);
            String[] tokens = raw.split("\n", 2);
            if (tokens.length != 2) {
                return null;
            }
            return new LinkState(tokens[0], tokens[1]);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String resolveRedirectUri(HttpServletRequest request) {
        if (!shouldUseRequestHostFallback(request)) {
            return redirectUri;
        }
        String proto = firstNonBlank(request.getHeader("X-Forwarded-Proto"), request.getScheme());
        String host = firstNonBlank(request.getHeader("X-Forwarded-Host"), request.getHeader("Host"));
        if (!hasText(proto) || !hasText(host)) {
            return redirectUri;
        }
        return proto + "://" + host + "/oauth2/success";
    }

    private boolean shouldUseRequestHostFallback(HttpServletRequest request) {
        return !hasText(redirectUri);
    }

    private String resolveRequestOrigin(HttpServletRequest request) {
        String proto = firstNonBlank(request.getHeader("X-Forwarded-Proto"), request.getScheme());
        String host = firstNonBlank(request.getHeader("X-Forwarded-Host"), request.getHeader("Host"));
        if (!hasText(proto) || !hasText(host)) {
            return "";
        }
        return proto + "://" + host;
    }

    private static String firstNonBlank(String first, String second) {
        return hasText(first) ? first : second;
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

    private static String safeLower(String value) {
        return value == null ? null : value.toLowerCase();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private record LinkState(String linkToken, String returnTo) {
    }
}
