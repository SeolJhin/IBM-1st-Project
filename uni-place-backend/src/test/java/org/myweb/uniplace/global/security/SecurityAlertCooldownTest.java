package org.myweb.uniplace.global.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SecurityAlertCooldownTest {

    @Mock
    private NotificationService notificationService;

    private RestAuthenticationEntryPoint authenticationEntryPoint;
    private RestAccessDeniedHandler accessDeniedHandler;

    @BeforeEach
    void setUp() throws Exception {
        authenticationEntryPoint = new RestAuthenticationEntryPoint(notificationService);
        accessDeniedHandler = new RestAccessDeniedHandler(notificationService);
        clearState(RestAuthenticationEntryPoint.class, "UNAUTH_WINDOWS", "LAST_ALERT_AT");
        clearState(RestAccessDeniedHandler.class, "DENY_WINDOWS", "LAST_ALERT_AT");
    }

    @AfterEach
    void tearDown() throws Exception {
        clearState(RestAuthenticationEntryPoint.class, "UNAUTH_WINDOWS", "LAST_ALERT_AT");
        clearState(RestAccessDeniedHandler.class, "DENY_WINDOWS", "LAST_ALERT_AT");
    }

    @Test
    @DisplayName("401 비정상 접근 알림은 60분 쿨다운 내 재발송되지 않는다")
    void authenticationAlertDoesNotRepeatWithinCooldown() throws Exception {
        String path = "/api/protected";
        String ip = "10.0.0.1";
        String key = ip + "|" + path;

        seedState(RestAuthenticationEntryPoint.class, "UNAUTH_WINDOWS", "LAST_ALERT_AT", key, 7, 10);

        MockHttpServletRequest request = newRequest(path, ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        authenticationEntryPoint.commence(request, response, new InsufficientAuthenticationException("unauthorized"));

        verify(notificationService, never()).notifyAdmins(
            eq(NotificationType.ADM_ABNORMAL_API.name()),
            anyString(),
            isNull(),
            eq(TargetType.notice),
            isNull(),
            eq("/admin/security")
        );
    }

    @Test
    @DisplayName("401 비정상 접근 알림은 쿨다운 이후 재발송될 수 있다")
    void authenticationAlertCanRepeatAfterCooldown() throws Exception {
        String path = "/api/protected";
        String ip = "10.0.0.1";
        String key = ip + "|" + path;

        seedState(RestAuthenticationEntryPoint.class, "UNAUTH_WINDOWS", "LAST_ALERT_AT", key, 7, 61);

        MockHttpServletRequest request = newRequest(path, ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        authenticationEntryPoint.commence(request, response, new InsufficientAuthenticationException("unauthorized"));

        verify(notificationService, times(1)).notifyAdmins(
            eq(NotificationType.ADM_ABNORMAL_API.name()),
            anyString(),
            isNull(),
            eq(TargetType.notice),
            isNull(),
            eq("/admin/security")
        );
    }

    @Test
    @DisplayName("403 비정상 접근 알림은 60분 쿨다운 내 재발송되지 않는다")
    void accessDeniedAlertDoesNotRepeatWithinCooldown() throws Exception {
        String path = "/api/admin-only";
        String ip = "10.0.0.2";
        String key = ip + "|" + path;

        seedState(RestAccessDeniedHandler.class, "DENY_WINDOWS", "LAST_ALERT_AT", key, 7, 10);

        MockHttpServletRequest request = newRequest(path, ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        accessDeniedHandler.handle(request, response, new AccessDeniedException("forbidden"));

        verify(notificationService, never()).notifyAdmins(
            eq(NotificationType.ADM_ABNORMAL_API.name()),
            anyString(),
            isNull(),
            eq(TargetType.notice),
            isNull(),
            eq("/admin/security")
        );
    }

    private static MockHttpServletRequest newRequest(String path, String ip) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
        request.setRemoteAddr(ip);
        request.addHeader("User-Agent", "sqlmap");
        return request;
    }

    private static void seedState(
        Class<?> clazz,
        String windowsFieldName,
        String lastAlertFieldName,
        String key,
        int requestCountInWindow,
        long lastAlertMinutesAgo
    ) throws Exception {
        Map<String, Deque<LocalDateTime>> windows = staticMap(clazz, windowsFieldName);
        Map<String, LocalDateTime> lastAlerts = staticMap(clazz, lastAlertFieldName);

        LocalDateTime now = LocalDateTime.now();
        Deque<LocalDateTime> window = new ArrayDeque<>();
        for (int i = 0; i < requestCountInWindow; i++) {
            window.addLast(now.minusSeconds(60L + i));
        }

        windows.put(key, window);
        lastAlerts.put(key, now.minusMinutes(lastAlertMinutesAgo));
    }

    private static void clearState(Class<?> clazz, String windowsFieldName, String lastAlertFieldName) throws Exception {
        staticMap(clazz, windowsFieldName).clear();
        staticMap(clazz, lastAlertFieldName).clear();
    }

    @SuppressWarnings("unchecked")
    private static <T> Map<String, T> staticMap(Class<?> clazz, String fieldName) throws Exception {
        Field field = clazz.getDeclaredField(fieldName);
        field.setAccessible(true);
        return (Map<String, T>) field.get(null);
    }
}
