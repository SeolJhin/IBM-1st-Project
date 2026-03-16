package org.myweb.uniplace.global.security.oauth;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.util.SerializationUtils;

public class HttpCookieOAuth2AuthorizationRequestRepository
    implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    private static final String COOKIE_NAME = "oauth2_auth_request";
    private static final int EXPIRE_SECONDS = 180;

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        Cookie cookie = getCookie(request, COOKIE_NAME);
        if (cookie == null || cookie.getValue() == null || cookie.getValue().isBlank()) {
            return null;
        }
        return deserialize(cookie.getValue());
    }

    @Override
    public void saveAuthorizationRequest(
        OAuth2AuthorizationRequest authorizationRequest,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        if (authorizationRequest == null) {
            removeCookie(request, response, COOKIE_NAME);
            return;
        }
        addCookie(request, response, COOKIE_NAME, serialize(authorizationRequest), EXPIRE_SECONDS);
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        OAuth2AuthorizationRequest loaded = loadAuthorizationRequest(request);
        removeCookie(request, response, COOKIE_NAME);
        return loaded;
    }

    private static Cookie getCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return cookie;
            }
        }
        return null;
    }

    private static void addCookie(
        HttpServletRequest request,
        HttpServletResponse response,
        String name,
        String value,
        int maxAge
    ) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
            .path("/")
            .httpOnly(true)
            .secure(true)
            .sameSite("Lax")
            .maxAge(maxAge);

        String cookieDomain = resolveCookieDomain(request);
        if (cookieDomain != null) {
            builder.domain(cookieDomain);
        }

        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    private static void removeCookie(HttpServletRequest request, HttpServletResponse response, String name) {
        Cookie cookie = getCookie(request, name);
        if (cookie == null) {
            return;
        }

        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, "")
            .path("/")
            .httpOnly(true)
            .secure(true)
            .sameSite("Lax")
            .maxAge(0);

        String cookieDomain = resolveCookieDomain(request);
        if (cookieDomain != null) {
            builder.domain(cookieDomain);
        }

        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    private static String resolveCookieDomain(HttpServletRequest request) {
        String host = request.getHeader("X-Forwarded-Host");
        if (host == null || host.isBlank()) {
            host = request.getHeader("Host");
        }
        if (host == null || host.isBlank()) {
            host = request.getServerName();
        }
        if (host == null || host.isBlank()) {
            return null;
        }

        String normalizedHost = host.split(",")[0].trim();
        int portIndex = normalizedHost.indexOf(':');
        if (portIndex >= 0) {
            normalizedHost = normalizedHost.substring(0, portIndex);
        }

        if ("uniplace.site".equals(normalizedHost) || normalizedHost.endsWith(".uniplace.site")) {
            return "uniplace.site";
        }
        return null;
    }

    private static String serialize(OAuth2AuthorizationRequest authorizationRequest) {
        byte[] bytes = SerializationUtils.serialize(authorizationRequest);
        return Base64.getUrlEncoder().encodeToString(bytes);
    }

    private static OAuth2AuthorizationRequest deserialize(String value) {
        byte[] bytes = Base64.getUrlDecoder().decode(value.getBytes(StandardCharsets.UTF_8));
        return (OAuth2AuthorizationRequest) SerializationUtils.deserialize(bytes);
    }
}
