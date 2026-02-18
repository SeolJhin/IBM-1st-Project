package org.myweb.uniplace.global.security.oauth;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.global.security.JwtProvider;
import org.myweb.uniplace.global.security.oauth.UserContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;

    // React 주소
    private final String REDIRECT_URI = "http://localhost:3000/oauth2/success";

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {

        // CustomOAuth2UserService에서 만든 UserContext 가져오기
        UserContext userContext = (UserContext) authentication.getPrincipal();

        String userId = userContext.getUserId();
        String email = userContext.getEmail();
        String role = userContext.getRole();

        // JWT 생성
        String accessToken = jwtProvider.createAccessToken(userId, role);
        String refreshToken = jwtProvider.createRefreshToken(userId);

        // URL encode
        String encodedAccessToken = URLEncoder.encode(accessToken, StandardCharsets.UTF_8);
        String encodedRefreshToken = URLEncoder.encode(refreshToken, StandardCharsets.UTF_8);

        // React로 redirect (토큰 포함)
        String redirectUrl =
                REDIRECT_URI
                        + "?accessToken=" + encodedAccessToken
                        + "&refreshToken=" + encodedRefreshToken;

        response.sendRedirect(redirectUrl);
    }
}
