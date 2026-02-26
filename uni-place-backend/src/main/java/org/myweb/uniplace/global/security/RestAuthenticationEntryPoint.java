package org.myweb.uniplace.global.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;

@Slf4j
@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {
    private static final int THRESHOLD = 30;
    private static final long WINDOW_MINUTES = 5L;
    private static final Deque<LocalDateTime> UNAUTH_WINDOW = new ArrayDeque<>();
    private static LocalDateTime lastAlertAt;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final NotificationService notificationService;

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException {
        recordUnauthorizedRequest(request);

        ErrorCode ec = ErrorCode.UNAUTHORIZED;
        response.setStatus(ec.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), ApiResponse.error(ec));
    }

    private void recordUnauthorizedRequest(HttpServletRequest request) {
        LocalDateTime now = LocalDateTime.now();
        boolean shouldAlert = false;
        synchronized (UNAUTH_WINDOW) {
            LocalDateTime start = now.minusMinutes(WINDOW_MINUTES);
            while (!UNAUTH_WINDOW.isEmpty() && UNAUTH_WINDOW.peekFirst().isBefore(start)) {
                UNAUTH_WINDOW.pollFirst();
            }
            UNAUTH_WINDOW.addLast(now);
            if (UNAUTH_WINDOW.size() >= THRESHOLD && (lastAlertAt == null || lastAlertAt.isBefore(start))) {
                shouldAlert = true;
                lastAlertAt = now;
            }
        }

        String userAgent = safe(request.getHeader("User-Agent"));
        String path = safe(request.getRequestURI());
        if (isSuspiciousUserAgent(userAgent)) {
            shouldAlert = true;
        }

        if (!shouldAlert) {
            return;
        }

        try {
            notificationService.notifyAdmins(
                NotificationType.ADM_ABNORMAL_API.name(),
                "Abnormal API access detected(401). path=" + path
                    + ", ip=" + safe(request.getRemoteAddr())
                    + ", ua=" + userAgent,
                null,
                TargetType.notice,
                null,
                "/admin/security"
            );
        } catch (Exception e) {
            log.warn("[SECURITY][NOTIFY][ADMIN] 401 alert failed reason={}", e.getMessage());
        }
    }

    private static boolean isSuspiciousUserAgent(String ua) {
        String v = ua.toLowerCase(Locale.ROOT);
        return v.contains("sqlmap")
            || v.contains("nmap")
            || v.contains("nikto")
            || v.contains("python-requests")
            || v.contains("curl");
    }

    private static String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
