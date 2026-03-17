package org.myweb.uniplace.global.security.oauth;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

@Component
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    private static final String LINK_STATE_PREFIX = "link.";

    @Value("${app.oauth2.redirect-uri:}")
    private String redirectUri;

    @Value("${app.frontend-url:}")
    private String frontendUrl;

    @Override
    public void onAuthenticationFailure(
        HttpServletRequest request,
        HttpServletResponse response,
        AuthenticationException exception
    ) throws IOException, ServletException {
        String reason = exception == null || exception.getMessage() == null
            ? "oauth_login_failed"
            : exception.getMessage();

        LinkState linkState = parseLinkState(request.getParameter("state"));
        if (linkState != null) {
            String returnTo = sanitizeReturnPath(linkState.returnTo());
            String redirect = buildFrontendUrl(request, appendQuery(returnTo, "linkError", "oauth_login_failed"));
            response.sendRedirect(redirect);
            return;
        }

        String resolvedRedirectUri = resolveRedirectUri(request);
        String redirectUrl = resolvedRedirectUri
            + "#error=oauth_login_failed"
            + "&reason=" + URLEncoder.encode(reason, StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
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

    private String appendQuery(String path, String key, String value) {
        String delimiter = path.contains("?") ? "&" : "?";
        return path + delimiter + key + "=" + URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String buildFrontendUrl(HttpServletRequest request, String path) {
        String base = hasText(frontendUrl) ? frontendUrl : resolveRequestOrigin(request);
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

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private record LinkState(String linkToken, String returnTo) {
    }
}
