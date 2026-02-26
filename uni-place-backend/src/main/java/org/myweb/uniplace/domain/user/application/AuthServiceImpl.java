package org.myweb.uniplace.domain.user.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final OAuthCompleteService oAuthCompleteService;

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

        if (userRepository.existsByUserEmail(userEmail)) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
        if (userRepository.existsByUserTel(userTel)) {
            throw new BusinessException(ErrorCode.DUPLICATE_TEL);
        }

        String userId = IdGenerator.generate("USR");
        User user = User.builder()
            .userId(userId)
            .userNm(req.getUserNm())
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
    }

    @Override
    @Transactional
    public UserTokenResponse login(UserLoginRequest req, String userAgent, String ip) {
        if (req == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        String userEmail = normalizeEmail(req.getUserEmail());

        User user = userRepository.findByUserEmail(userEmail).orElse(null);
        if (user == null) {
            log.warn("[LOGIN_FAIL] reason=USER_NOT_FOUND email={}", userEmail);
            throw new BusinessException(ErrorCode.BAD_REQUEST); /*INVALID_CREDENTIALS로 변경*/
        }

        if (!passwordEncoder.matches(req.getUserPwd(), user.getUserPwd())) {
            log.warn("[LOGIN_FAIL] reason=PASSWORD_MISMATCH userId={}", user.getUserId());
            throw new BusinessException(ErrorCode.BAD_REQUEST); /*INVALID_CREDENTIALS로 변경*/
        }

        if (!user.canLogin()) {
            log.warn("[LOGIN_FAIL] reason=USER_CANNOT_LOGIN userId={} status={} deleteYn={}",
                    user.getUserId(), user.getUserSt(), user.getDeleteYN());
            throw new BusinessException(ErrorCode.BAD_REQUEST); /*INVALID_CREDENTIALS로 변경*/
        }

        user.markLoginNow();

        String deviceId = resolveDeviceId(req.getDeviceId());

        if (user.getFirstSign() == null) {
            user.markFirstLoginFlagIfNeeded();
        }

        String accessToken = jwtProvider.createAccessToken(user.getUserId(), requireRoleName(user));
        String refreshToken = jwtProvider.createRefreshToken(user.getUserId());

        String tokenHash = sha256Hex(refreshToken);

        LocalDateTime now = LocalDateTime.now();
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
}
