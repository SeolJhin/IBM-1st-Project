package org.myweb.uniplace.domain.user.application;

import lombok.RequiredArgsConstructor;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final IdGenerator idGenerator;

    @Value("${jwt.refresh-exp:86400000}")
    private long refreshExpMillis;

    @Override
    @Transactional
    public void signup(UserSignupRequest req) {
        if (userRepository.existsByUserEmail(req.getUserEmail())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }

        String userId = idGenerator.generate("USR");
        User user = User.builder()
                .userId(userId)
                .userNm(req.getUserNm())
                .userEmail(req.getUserEmail())
                .userPwd(passwordEncoder.encode(req.getUserPwd()))
                .userBirth(req.getUserBirth())
                .userTel(req.getUserTel())
                .userRole(UserRole.user)
                .userSt(UserStatus.active)
                .deleteYN("N")
                .build();

        userRepository.save(user);
    }

    @Override
    @Transactional
    public UserTokenResponse login(UserLoginRequest req, String userAgent, String ip) {
        User user = userRepository.findByUserEmail(req.getUserEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));

        if (!passwordEncoder.matches(req.getUserPwd(), user.getUserPwd())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        String deviceId = req.getDeviceId();
        if (deviceId == null || deviceId.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        String accessToken = jwtProvider.createAccessToken(user.getUserId(), user.getUserRole().name());
        String refreshToken = jwtProvider.createRefreshToken(user.getUserId());

        String tokenHash = sha256Hex(refreshToken);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(refreshExpMillis / 1000);

        RefreshToken rt = RefreshToken.builder()
                .refreshTokenId(idGenerator.generate("RTK"))
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

        return UserTokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .deviceId(deviceId)
                .build();
    }

    @Override
    @Transactional
    public UserTokenResponse refresh(RefreshTokenRequest req, String userAgent, String ip) {
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

        LocalDateTime now = LocalDateTime.now();

        if (saved.isExpired(now)) {
            throw new BusinessException(ErrorCode.TOKEN_EXPIRED);
        }

        // (선택) 요청 deviceId가 있으면 저장된 deviceId와 일치 검증
        if (req.getDeviceId() != null && !req.getDeviceId().isBlank()
                && !req.getDeviceId().equals(saved.getDeviceId())) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }

        // revoked 토큰이 다시 사용됨 => 재사용 탐지 -> 전체 로그아웃
        if (saved.isRevoked()) {
            refreshTokenRepository.revokeAllActiveByUserId(userId, now);
            throw new BusinessException(ErrorCode.TOKEN_REUSE_DETECTED);
        }

        // rotation: 기존 토큰 revoke + lastUsed 갱신
        saved.revoke(now);
        saved.markLastUsed(now);

        String newRefreshToken = jwtProvider.createRefreshToken(userId);
        String newHash = sha256Hex(newRefreshToken);

        User user = saved.getUser();
        String deviceId = saved.getDeviceId();

        LocalDateTime expiresAt = now.plusSeconds(refreshExpMillis / 1000);

        RefreshToken newRt = RefreshToken.builder()
                .refreshTokenId(idGenerator.generate("RTK"))
                .user(user)
                .tokenHash(newHash)
                .deviceId(deviceId)
                .userAgent(userAgent) // 최신 userAgent/ip로 갱신 저장
                .ip(ip)
                .expiresAt(expiresAt)
                .revoked(false)
                .lastUsedAt(now)
                .build();

        refreshTokenRepository.save(newRt);

        String newAccessToken = jwtProvider.createAccessToken(userId, user.getUserRole().name());

        return UserTokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .deviceId(deviceId)
                .build();
    }

    @Override
    @Transactional
    public void logout(LogoutRequest req) {
        if (req == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        String refreshToken = req.getRefreshToken();
        String deviceId = req.getDeviceId();

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }
        if (deviceId == null || deviceId.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        jwtProvider.validate(refreshToken);
        if (!"refresh".equals(jwtProvider.getTokenType(refreshToken))) {
            throw new BusinessException(ErrorCode.TOKEN_TYPE_INVALID);
        }

        String userId = jwtProvider.getSubject(refreshToken);
        refreshTokenRepository.revokeActiveByUserIdAndDeviceId(userId, deviceId, LocalDateTime.now());
    }

    @Override
    @Transactional
    public void logoutAll(String userId) {
        refreshTokenRepository.revokeAllActiveByUserId(userId, LocalDateTime.now());
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
}
