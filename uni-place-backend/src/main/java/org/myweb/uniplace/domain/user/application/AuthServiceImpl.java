package org.myweb.uniplace.domain.user.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.user.api.dto.request.KakaoSignupCompleteRequest;
import org.myweb.uniplace.domain.user.api.dto.request.LogoutRequest;
import org.myweb.uniplace.domain.user.api.dto.request.RefreshTokenRequest;
import org.myweb.uniplace.domain.user.api.dto.request.UserLoginRequest;
import org.myweb.uniplace.domain.user.api.dto.request.UserSignupRequest;
import org.myweb.uniplace.domain.user.api.dto.response.UserTokenResponse;
import org.myweb.uniplace.domain.user.domain.entity.RefreshToken;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.domain.enums.UserRole;
import org.myweb.uniplace.domain.user.domain.enums.UserStatus;
import org.myweb.uniplace.domain.user.repository.RefreshTokenRepository;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.security.JwtProvider;
import org.myweb.uniplace.global.util.IdGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.myweb.uniplace.domain.user.api.dto.request.FindEmailRequest;
import org.myweb.uniplace.domain.user.api.dto.request.PasswordResetRequest;
import org.myweb.uniplace.domain.user.api.dto.request.PasswordResetConfirmRequest;
import org.myweb.uniplace.domain.user.domain.entity.PasswordResetToken;
import org.myweb.uniplace.domain.user.repository.PasswordResetTokenRepository;
import org.myweb.uniplace.global.util.MailService;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    private static final int LOGIN_FAIL_THRESHOLD = 5;
    private static final long LOGIN_FAIL_WINDOW_MINUTES = 5L;
    private static final long LOGIN_LOCK_MINUTES = 5L;
    private static final int GLOBAL_LOGIN_FAIL_ALERT_THRESHOLD = 30;
    private static final DateTimeFormatter TS_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Map<String, LoginAttemptState> LOGIN_ATTEMPTS = new ConcurrentHashMap<>();
    private static final Deque<LocalDateTime> GLOBAL_LOGIN_FAILURES = new ArrayDeque<>();
    private static LocalDateTime lastGlobalFailAlertAt;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final OAuthCompleteService oAuthCompleteService;
    private final NotificationService notificationService;
    
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final MailService mailService;
    private final EmailVerificationStore emailVerificationStore;

    @Value("${jwt.refresh-exp:86400000}")
    private long refreshExpMillis;

    @Override
    @Transactional
    public void signup(UserSignupRequest req) {
        if (req == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        String userEmail = normalizeEmail(req.getUserEmail());
        String userTel = req.getUserTel() == null ? null : req.getUserTel().trim();

        // ✅ 이메일 인증 완료 여부 확인
        if (!emailVerificationStore.isVerified(userEmail)) {
            throw new BusinessException(ErrorCode.EMAIL_NOT_VERIFIED);
        }

        if (userRepository.existsByUserEmail(userEmail)) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
        if (userRepository.existsByUserTel(userTel)) {
            throw new BusinessException(ErrorCode.DUPLICATE_TEL);
        }

        String userNickname = req.getUserNickname() == null ? null : req.getUserNickname().trim();
        if (userNickname == null || userNickname.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        if (userRepository.existsByUserNickname(userNickname)) {
            throw new BusinessException(ErrorCode.DUPLICATE_NICKNAME);
        }

        String userId = IdGenerator.generate("USR");
        User user = User.builder()
            .userId(userId)
            .userNm(req.getUserNm())
            .userNickname(userNickname)
            .userEmail(userEmail)
            .userPwd(passwordEncoder.encode(req.getUserPwd()))
            .userBirth(req.getUserBirth())
            .userTel(userTel)
            .userRole(UserRole.user)
            .userSt(UserStatus.active)
            .deleteYN("N")
            .firstSign("N")
            .build();

        userRepository.save(user);

        // 가입 완료 후 인증 항목 제거
        emailVerificationStore.remove(userEmail);
    }

    @Override
    @Transactional
    public UserTokenResponse login(UserLoginRequest req, String userAgent, String ip) {
        if (req == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        String userEmail = normalizeEmail(req.getUserEmail());
        LocalDateTime now = LocalDateTime.now();

        User user = userRepository.findByUserEmail(userEmail).orElse(null);
        if (user == null) {
            log.warn("[LOGIN_FAIL] reason=USER_NOT_FOUND email={}", userEmail);
            recordGlobalLoginFailure(now);
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        if (isLoginLocked(user.getUserId(), now)) {
            log.warn("[LOGIN_FAIL] reason=LOCKED userId={}", user.getUserId());
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        if (!passwordEncoder.matches(req.getUserPwd(), user.getUserPwd())) {
            log.warn("[LOGIN_FAIL] reason=PASSWORD_MISMATCH userId={}", user.getUserId());
            recordLoginFailure(user, now, req.getDeviceId(), userAgent, ip);
            recordGlobalLoginFailure(now);
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        if (!user.canLogin()) {
            log.warn("[LOGIN_FAIL] reason=USER_CANNOT_LOGIN userId={} status={} deleteYn={}",
                user.getUserId(), user.getUserSt(), user.getDeleteYN());
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        user.markLoginNow();

        String deviceId = resolveDeviceId(req.getDeviceId());
        boolean hasAnyDevice = refreshTokenRepository.existsByUser_UserIdAndRevokedFalse(user.getUserId());
        boolean isKnownDevice = refreshTokenRepository
            .existsByUser_UserIdAndDeviceIdAndRevokedFalse(user.getUserId(), deviceId);

        if (user.getFirstSign() == null) {
            user.markFirstLoginFlagIfNeeded();
        }

        String accessToken = jwtProvider.createAccessToken(user.getUserId(), requireRoleName(user));
        String refreshToken = jwtProvider.createRefreshToken(user.getUserId());
        String tokenHash = sha256Hex(refreshToken);

        LocalDateTime expiresAt = now.plusSeconds(refreshExpMillis / 1000);

        RefreshToken rt = RefreshToken.builder()
            .refreshTokenId(IdGenerator.generate("RTK"))
            .user(user)
            .tokenHash(tokenHash)
            .deviceId(deviceId)
            .userAgent(userAgent)
            .ip(ip)
            .expiresAt(expiresAt)
            .revoked(false)
            .lastUsedAt(now)
            .build();

        refreshTokenRepository.save(rt);
        clearLoginFailures(user.getUserId());
        notifyAdminLoginSuccess(user, deviceId, ip, userAgent, now);

        if (hasAnyDevice && !isKnownDevice) {
            notifyNewDeviceLogin(user, deviceId, ip, userAgent);
        }

        boolean additionalInfoRequired = user.isAdditionalInfoRequired();

        return UserTokenResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .deviceId(deviceId)
            .additionalInfoRequired(additionalInfoRequired)
            .build();
    }

    @Override
    @Transactional
    public UserTokenResponse refresh(RefreshTokenRequest req, String userAgent, String ip) {
        if (req == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        String refreshToken = req.getRefreshToken();
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }

        jwtProvider.validate(refreshToken);

        if (!"refresh".equals(jwtProvider.getTokenType(refreshToken))) {
            throw new BusinessException(ErrorCode.TOKEN_TYPE_INVALID);
        }

        String userId = jwtProvider.getSubject(refreshToken);
        String tokenHash = sha256Hex(refreshToken);

        RefreshToken saved = refreshTokenRepository.findByTokenHashForUpdate(tokenHash)
            .orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

        if (!saved.getUser().getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }

        LocalDateTime now = LocalDateTime.now();

        if (saved.isExpired(now)) {
            throw new BusinessException(ErrorCode.TOKEN_EXPIRED);
        }

        if (req.getDeviceId() != null && !req.getDeviceId().isBlank()
            && !req.getDeviceId().equals(saved.getDeviceId())) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }

        User user = saved.getUser();
        if (user == null || !user.canLogin()) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        if (saved.isRevoked()) {
            refreshTokenRepository.revokeAllActiveByUserId(userId, now);
            throw new BusinessException(ErrorCode.TOKEN_REUSE_DETECTED);
        }

        saved.revoke(now);
        saved.markLastUsed(now);

        String newRefreshToken = jwtProvider.createRefreshToken(userId);
        String newHash = sha256Hex(newRefreshToken);

        String deviceId = saved.getDeviceId();
        LocalDateTime expiresAt = now.plusSeconds(refreshExpMillis / 1000);

        RefreshToken newRt = RefreshToken.builder()
            .refreshTokenId(IdGenerator.generate("RTK"))
            .user(user)
            .tokenHash(newHash)
            .deviceId(deviceId)
            .userAgent(userAgent)
            .ip(ip)
            .expiresAt(expiresAt)
            .revoked(false)
            .lastUsedAt(now)
            .build();

        refreshTokenRepository.save(newRt);

        String newAccessToken = jwtProvider.createAccessToken(userId, requireRoleName(user));

        return UserTokenResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(newRefreshToken)
            .deviceId(deviceId)
            .additionalInfoRequired(user.isAdditionalInfoRequired())
            .build();
    }

    @Override
    @Transactional
    public void logout(LogoutRequest req) {
        if (req == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        String refreshToken = req.getRefreshToken();
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }

        jwtProvider.validate(refreshToken);
        if (!"refresh".equals(jwtProvider.getTokenType(refreshToken))) {
            throw new BusinessException(ErrorCode.TOKEN_TYPE_INVALID);
        }

        String userId = jwtProvider.getSubject(refreshToken);
        String tokenHash = sha256Hex(refreshToken);

        RefreshToken saved = refreshTokenRepository.findByTokenHashForUpdate(tokenHash)
            .orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

        if (!saved.getUser().getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }

        saved.revoke(LocalDateTime.now());
    }

    @Override
    @Transactional
    public void logoutAll(String userId) {
        refreshTokenRepository.revokeAllActiveByUserId(userId, LocalDateTime.now());
    }

    @Override
    @Transactional
    public UserTokenResponse kakaoComplete(KakaoSignupCompleteRequest req, String userAgent, String ip) {
        if (req == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        return oAuthCompleteService.kakaoComplete(req, userAgent, ip);
    }

    @Override
    @Transactional
    public UserTokenResponse googleComplete(KakaoSignupCompleteRequest req, String userAgent, String ip) {
        if (req == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        return oAuthCompleteService.googleComplete(req, userAgent, ip);
    }

    private String sha256Hex(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digested = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digested);
        } catch (Exception e) {
            throw new IllegalStateException("sha256 failed", e);
        }
    }

    private static String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase();
    }

    private static String requireRoleName(User user) {
        if (user == null || user.getUserRole() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return user.getUserRole().name();
    }

    private static String resolveDeviceId(String deviceId) {
        if (deviceId != null && !deviceId.isBlank()) {
            return deviceId.trim();
        }
        return "WEB-" + UUID.randomUUID();
    }

    private boolean isLoginLocked(String userId, LocalDateTime now) {
        LoginAttemptState state = LOGIN_ATTEMPTS.get(userId);
        if (state == null) {
            return false;
        }
        synchronized (state) {
            if (state.lockedUntil == null) {
                return false;
            }
            if (state.lockedUntil.isAfter(now)) {
                return true;
            }
            state.lockedUntil = null;
            state.lockNotifiedUntil = null;
            state.failures.clear();
            return false;
        }
    }

    private void recordLoginFailure(User user, LocalDateTime now, String deviceId, String userAgent, String ip) {
        if (user == null || user.getUserId() == null) {
            return;
        }
        LoginAttemptState state = LOGIN_ATTEMPTS.computeIfAbsent(user.getUserId(), k -> new LoginAttemptState());
        synchronized (state) {
            LocalDateTime windowStart = now.minusMinutes(LOGIN_FAIL_WINDOW_MINUTES);
            while (!state.failures.isEmpty() && state.failures.peekFirst().isBefore(windowStart)) {
                state.failures.pollFirst();
            }
            state.failures.addLast(now);

            if (state.failures.size() < LOGIN_FAIL_THRESHOLD) {
                return;
            }

            LocalDateTime lockUntil = now.plusMinutes(LOGIN_LOCK_MINUTES);
            state.lockedUntil = lockUntil;
            if (state.lockNotifiedUntil != null && !state.lockNotifiedUntil.isBefore(lockUntil)) {
                return;
            }
            state.lockNotifiedUntil = lockUntil;

            safeNotifyUser(
                user.getUserId(),
                NotificationType.SEC_LOGIN_LOCK.name(),
                "반복된 로그인 실패로 5분 동안 로그인이 차단되었습니다. (해제시각="
                    + lockUntil.format(TS_FMT)
                    + ", deviceId=" + safe(deviceId)
                    + ", ip=" + safe(ip)
                    + ", ua=" + safe(userAgent) + ")"
            );
            notifyAdminLoginLock(user, deviceId, ip, userAgent, lockUntil);
        }
    }

    private void clearLoginFailures(String userId) {
        if (userId == null) {
            return;
        }
        LOGIN_ATTEMPTS.remove(userId);
    }

    private void notifyNewDeviceLogin(User user, String deviceId, String ip, String userAgent) {
        if (user == null || user.getUserId() == null) {
            return;
        }
        safeNotifyUser(
            user.getUserId(),
            NotificationType.SEC_NEW_DEVICE.name(),
            "새 기기 로그인 감지. (deviceId=" + safe(deviceId)
                + ", ip=" + safe(ip)
                + ", ua=" + safe(userAgent) + ")"
        );
        if (isAdmin(user)) {
            safeNotifyAdmins(
                NotificationType.ADM_NEW_DEVICE.name(),
                "관리자 계정의 새 기기 로그인이 감지되었습니다. 관리자ID=" + user.getUserId()
                    + ", deviceId=" + safe(deviceId)
                    + ", ip=" + safe(ip)
                    + ", ua=" + safe(userAgent),
                user.getUserId()
            );
        }
    }

    private void safeNotifyUser(String userId, String code, String message) {
        try {
            notificationService.notifyUser(
                userId,
                code,
                message,
                null,
                TargetType.notice,
                null,
                "/mypage/security"
            );
        } catch (Exception e) {
            log.warn("[AUTH][NOTIFY] failed userId={} code={} reason={}", userId, code, e.getMessage());
        }
    }

    private void safeNotifyAdmins(String code, String message, String senderId) {
        try {
            notificationService.notifyAdmins(
                code,
                message,
                senderId,
                TargetType.notice,
                null,
                "/admin/users"
            );
        } catch (Exception e) {
            log.warn("[AUTH][NOTIFY][ADMIN] failed code={} reason={}", code, e.getMessage());
        }
    }

    private void notifyAdminLoginSuccess(User user, String deviceId, String ip, String userAgent, LocalDateTime now) {
        if (!isAdmin(user)) {
            return;
        }
        safeNotifyAdmins(
            NotificationType.ADM_LOGIN_OK.name(),
            "관리자 로그인 성공. 관리자ID=" + user.getUserId()
                + ", 로그인시각=" + now.format(TS_FMT)
                + ", deviceId=" + safe(deviceId)
                + ", ip=" + safe(ip)
                + ", ua=" + safe(userAgent),
            user.getUserId()
        );
    }

    private void notifyAdminLoginLock(User user, String deviceId, String ip, String userAgent, LocalDateTime lockUntil) {
        if (!isAdmin(user)) {
            return;
        }
        safeNotifyAdmins(
            NotificationType.ADM_LOGIN_LOCK.name(),
            "반복된 실패로 관리자 로그인이 잠겼습니다. 관리자ID=" + user.getUserId()
                + ", 해제시각=" + lockUntil.format(TS_FMT)
                + ", deviceId=" + safe(deviceId)
                + ", ip=" + safe(ip)
                + ", ua=" + safe(userAgent),
            user.getUserId()
        );
    }

    private void recordGlobalLoginFailure(LocalDateTime now) {
        synchronized (GLOBAL_LOGIN_FAILURES) {
            LocalDateTime windowStart = now.minusMinutes(LOGIN_FAIL_WINDOW_MINUTES);
            while (!GLOBAL_LOGIN_FAILURES.isEmpty() && GLOBAL_LOGIN_FAILURES.peekFirst().isBefore(windowStart)) {
                GLOBAL_LOGIN_FAILURES.pollFirst();
            }
            GLOBAL_LOGIN_FAILURES.addLast(now);

            if (GLOBAL_LOGIN_FAILURES.size() < GLOBAL_LOGIN_FAIL_ALERT_THRESHOLD) {
                return;
            }
            if (lastGlobalFailAlertAt != null && lastGlobalFailAlertAt.isAfter(windowStart)) {
                return;
            }
            lastGlobalFailAlertAt = now;
        }

        safeNotifyAdmins(
            NotificationType.ADM_ABNORMAL_TRAFFIC.name(),
            "비정상 로그인 트래픽이 감지되었습니다. 로그인실패수="
                + GLOBAL_LOGIN_FAIL_ALERT_THRESHOLD
                + "+, 감지구간(분)=" + LOGIN_FAIL_WINDOW_MINUTES + ".",
            null
        );
    }

    private static String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private static boolean isAdmin(User user) {
        return user != null && user.getUserRole() != null && user.getUserRole().isAdmin();
    }

    private static final class LoginAttemptState {
        private final Deque<LocalDateTime> failures = new ArrayDeque<>();
        private LocalDateTime lockedUntil;
        private LocalDateTime lockNotifiedUntil;
    }
    
    // ----------------------------------------------------------------
    // 이메일 인증코드 발송
    // ----------------------------------------------------------------
    @Override
    public void sendEmailCode(String email) {
        if (email == null || email.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        String normalized = normalizeEmail(email);

        // 이미 가입된 이메일이면 거부
        if (userRepository.existsByUserEmail(normalized)) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }

        // 6자리 숫자 코드 생성 (쿨타임 체크 포함)
        String code = String.format("%06d", new Random().nextInt(1_000_000));
        try {
            emailVerificationStore.save(normalized, code);
        } catch (IllegalStateException e) {
            // 60초 쿨타임 중
            throw new BusinessException(ErrorCode.EMAIL_CODE_COOLDOWN);
        }
        mailService.sendEmailVerificationCode(normalized, code);
        log.info("[EMAIL_VERIFY] 인증코드 발송: email={}", normalized);
    }

    // ----------------------------------------------------------------
    // 이메일 인증코드 검증
    // ----------------------------------------------------------------
    @Override
    public boolean verifyEmailCode(String email, String code) {
        if (email == null || code == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        boolean result = emailVerificationStore.verify(normalizeEmail(email), code);
        if (!result) {
            throw new BusinessException(ErrorCode.EMAIL_CODE_INVALID);
        }
        return true;
    }

    // ----------------------------------------------------------------
    // 아이디(이메일) 찾기
    // ----------------------------------------------------------------
    @Override
    public String findEmail(FindEmailRequest req) {
        if (req == null) throw new BusinessException(ErrorCode.BAD_REQUEST);

        String userNm  = req.getUserNm()  == null ? null : req.getUserNm().trim();
        String userTel = req.getUserTel() == null ? null : req.getUserTel().trim();

        User user = userRepository.findByUserNmAndUserTel(userNm, userTel)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        return maskEmail(user.getUserEmail());
    }

    // ----------------------------------------------------------------
    // 비밀번호 재설정 요청 (이메일 발송)
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public void requestPasswordReset(PasswordResetRequest req) {
        if (req == null) throw new BusinessException(ErrorCode.BAD_REQUEST);

        String email = normalizeEmail(req.getUserEmail());
        User user = userRepository.findByUserEmail(email)
                .orElse(null);

        // 보안상: 이메일 존재 여부 노출 안 함 → 없어도 정상 응답
        if (user == null) {
            log.info("[PWD_RESET] 가입되지 않은 이메일로 요청: {}", email);
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        // 만료된 토큰 정리
        passwordResetTokenRepository.deleteExpiredTokens(now);

        // 이미 유효한 토큰이 있으면 재사용 (30분 이내 중복 발송 방지)
        String tokenValue = passwordResetTokenRepository
                .findActiveByUserId(user.getUserId(), now)
                .map(PasswordResetToken::getToken)
                .orElseGet(() -> {
                    String newToken = IdGenerator.generate("PRT").replace("PRT_", "");
                    PasswordResetToken prt = PasswordResetToken.builder()
                            .id(IdGenerator.generate("PRTID"))
                            .userId(user.getUserId())
                            .token(newToken)
                            .expiresAt(now.plusMinutes(30))
                            .used(false)
                            .build();
                    passwordResetTokenRepository.save(prt);
                    return newToken;
                });

        mailService.sendPasswordResetMail(user.getUserEmail(), tokenValue);
    }

    // ----------------------------------------------------------------
    // 토큰 유효성 검증 (페이지 진입 시 사전 확인)
    // ----------------------------------------------------------------
    @Override
    public void verifyPasswordResetToken(String token) {
        PasswordResetToken prt = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new BusinessException(ErrorCode.PASSWORD_RESET_TOKEN_INVALID));

        if (prt.isUsed() || prt.isExpired()) {
            throw new BusinessException(ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED);
        }
    }

    // ----------------------------------------------------------------
    // 비밀번호 재설정 확정
    // ----------------------------------------------------------------
    @Override
    @Transactional
    public void confirmPasswordReset(PasswordResetConfirmRequest req) {
        if (req == null) throw new BusinessException(ErrorCode.BAD_REQUEST);

        PasswordResetToken prt = passwordResetTokenRepository.findByToken(req.getToken())
                .orElseThrow(() -> new BusinessException(ErrorCode.PASSWORD_RESET_TOKEN_INVALID));

        if (prt.isUsed()) {
            throw new BusinessException(ErrorCode.PASSWORD_RESET_TOKEN_INVALID);
        }
        if (prt.isExpired()) {
            throw new BusinessException(ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED);
        }

        User user = userRepository.findById(prt.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        user.changePwd(passwordEncoder.encode(req.getNewPassword()));
        prt.markUsed();

        log.info("[PWD_RESET] 비밀번호 변경 완료: userId={}", user.getUserId());
    }

    // ----------------------------------------------------------------
    // 닉네임 중복 체크
    // ----------------------------------------------------------------
    @Override
    public boolean checkNicknameAvailable(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        String trimmed = nickname.trim();
        if (userRepository.existsByUserNickname(trimmed)) {
            throw new BusinessException(ErrorCode.DUPLICATE_NICKNAME);
        }
        return true;
    }

    // ----------------------------------------------------------------
    // private helpers
    // ----------------------------------------------------------------
    private static String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        int atIdx = email.indexOf('@');
        String local  = email.substring(0, atIdx);
        String domain = email.substring(atIdx);          // @domain.com

        if (local.length() <= 2) {
            // 짧은 경우: t*** 형태
            return local.charAt(0) + "***" + domain;
        }
        // 앞 2글자 + *** + 나머지
        return local.substring(0, 2) + "***" + domain;
    }

}
