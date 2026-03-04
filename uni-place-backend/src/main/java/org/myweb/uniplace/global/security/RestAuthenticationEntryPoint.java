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
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {
    private static final int THRESHOLD = 60;
    private static final int SUSPICIOUS_THRESHOLD = 8;
    private static final long WINDOW_MINUTES = 5L;
    private static final long ALERT_COOLDOWN_MINUTES = 60L;
    private static final Map<String, Deque<LocalDateTime>> UNAUTH_WINDOWS = new HashMap<>();
    private static final Map<String, LocalDateTime> LAST_ALERT_AT = new HashMap<>();

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
        String userAgent = safe(request.getHeader("User-Agent"));
        String path = safe(request.getRequestURI());
        String ip = safe(request.getRemoteAddr());

        boolean suspiciousUa = isSuspiciousUserAgent(userAgent);
        int threshold = suspiciousUa ? SUSPICIOUS_THRESHOLD : THRESHOLD;
        String bucketKey = ip + "|" + path;

        boolean shouldAlert = shouldAlert(bucketKey, now, threshold, UNAUTH_WINDOWS, LAST_ALERT_AT);
        if (!shouldAlert) {
            return;
        }

        try {
            notificationService.notifyAdmins(
                    NotificationType.ADM_ABNORMAL_API.name(),
                    "Abnormal API access detected (401). path=" + path
                            + ", ip=" + ip
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
                || v.contains("nikto");
    }

    private static boolean shouldAlert(
            String key,
            LocalDateTime now,
            int threshold,
            Map<String, Deque<LocalDateTime>> windows,
            Map<String, LocalDateTime> lastAlertAtMap
    ) {
        synchronized (windows) {
            LocalDateTime start = now.minusMinutes(WINDOW_MINUTES);
            Deque<LocalDateTime> window = windows.computeIfAbsent(key, ignored -> new ArrayDeque<>());

            while (!window.isEmpty() && window.peekFirst().isBefore(start)) {
                window.pollFirst();
            }

            window.addLast(now);
            if (window.size() < threshold) {
                return false;
            }

            LocalDateTime lastAlert = lastAlertAtMap.get(key);
            LocalDateTime cooldownStart = now.minusMinutes(ALERT_COOLDOWN_MINUTES);
            if (lastAlert != null && !lastAlert.isBefore(cooldownStart)) {
                return false;
            }

            lastAlertAtMap.put(key, now);
            return true;
        }
    }

    private static String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
