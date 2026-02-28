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
        String reason = exception == null || exception.getMessage() == null
            ? "oauth_login_failed"
            : exception.getMessage();

        String redirectUrl = redirectUri
            + "#error=oauth_login_failed"
            + "&reason=" + URLEncoder.encode(reason, StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
    }
}
