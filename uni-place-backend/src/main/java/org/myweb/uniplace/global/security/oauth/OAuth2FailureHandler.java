package org.myweb.uniplace.global.security.oauth;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

@Component
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    @Value("${app.oauth2.redirect-uri:http://localhost:3000/oauth2/success}")
    private String redirectUri;

    @Override
    public void onAuthenticationFailure(
        HttpServletRequest request,
        HttpServletResponse response,
        AuthenticationException exception
    ) throws IOException, ServletException {
        String resolvedRedirectUri = resolveRedirectUri(request);
        String reason = exception == null || exception.getMessage() == null
            ? "oauth_login_failed"
            : exception.getMessage();

        String redirectUrl = resolvedRedirectUri
            + "#error=oauth_login_failed"
            + "&reason=" + URLEncoder.encode(reason, StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
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
        if (!hasText(redirectUri)) {
            return true;
        }
        if (!redirectUri.contains("localhost")) {
            return false;
        }
        String host = firstNonBlank(request.getHeader("X-Forwarded-Host"), request.getHeader("Host"));
        return hasText(host)
            && !host.startsWith("localhost")
            && !host.startsWith("127.0.0.1");
    }

    private static String firstNonBlank(String first, String second) {
        return hasText(first) ? first : second;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
