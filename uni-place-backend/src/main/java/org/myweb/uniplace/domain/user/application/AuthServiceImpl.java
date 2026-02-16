package org.myweb.uniplace.domain.user.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.api.dto.request.*;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final IdGenerator idGenerator; // 없으면 UUID로 대체해도 됨

    @Override
    public void signup(UserSignupRequest req) {
        if (userRepository.existsByUserEmail(req.getUserEmail())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }
        if (userRepository.existsByUserTel(req.getUserTel())) {
            throw new BusinessException(ErrorCode.DUPLICATE_TEL);
        }

        String userId = safeUserId();
        String hashPwd = passwordEncoder.encode(req.getUserPwd());

        User user = User.builder()
                .userId(userId)
                .userName(req.getUserName())
                .userEmail(req.getUserEmail())
                .userPwd(hashPwd)
                .userBirth(req.getUserBirth())
                .userTel(req.getUserTel())
                .userRole(UserRole.host)          // DB 기본값에 맞춤 (원하면 guest/user로 바꿔도 됨)
                .userStatus(UserStatus.active)    // DB 기본값에 맞춤
                .deleteYn("N")
                .build();

        userRepository.save(user);
    }

    @Override
    public UserTokenResponse login(UserLoginRequest req, String userAgent, String ip) {
        User user = userRepository.findByUserEmail(req.getUserEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        if (!user.isActive()) {
            throw new BusinessException(ErrorCode.USER_INACTIVE);
        }

        if (!passwordEncoder.matches(req.getUserPwd(), user.getUserPwd())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        user.markLoginNow();

        String deviceId = (req.getDeviceId() == null || req.getDeviceId().isBlank())
                ? UUID.randomUUID().toString()
                : req.getDeviceId();

        String accessToken = jwtProvider.createAccessToken(user.getUserId(), user.getUserRole().name());
        String refreshToken = jwtProvider.createRefreshToken(user.getUserId());

        saveRefreshToken(user, refreshToken, deviceId, userAgent, ip);

        return UserTokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .deviceId(deviceId)
                .build();
    }

    @Override
    public UserTokenResponse refresh(RefreshTokenRequest req, String userAgent, String ip) {
        String refreshToken = req.getRefreshToken();
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_REQUIRED);
        }

        // 1) JWT 자체 검증(서명/만료)
        jwtProvider.validate(refreshToken);

        // 2) DB 조회는 token_hash로
        String tokenHash = sha256Hex(refreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

        if (stored.isRevoked()) throw new BusinessException(ErrorCode.REFRESH_TOKEN_REVOKED);
        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);

        // 3) deviceId 매칭 체크(실무형)
        String deviceId = req.getDeviceId();
        if (deviceId == null || deviceId.isBlank() || !deviceId.equals(stored.getDeviceId())) {
            throw new BusinessException(ErrorCode.DEVICE_MISMATCH);
        }

        // 4) Rotation: 기존 토큰 revoke + last_used_at 기록
        stored.revokeNow();
        stored.markLastUsedNow();

        // 5) 새 토큰 발급 + 새 row 저장
        User user = stored.getUser();
        if (!user.isActive()) throw new BusinessException(ErrorCode.USER_INACTIVE);

        String newAccess = jwtProvider.createAccessToken(user.getUserId(), user.getUserRole().name());
        String newRefresh = jwtProvider.createRefreshToken(user.getUserId());

        saveRefreshToken(user, newRefresh, deviceId, userAgent, ip);

        return UserTokenResponse.builder()
                .accessToken(newAccess)
                .refreshToken(newRefresh)
                .deviceId(deviceId)
                .build();
    }

    @Override
    public void logout(LogoutRequest req) {
        String refreshToken = req.getRefreshToken();
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_REQUIRED);
        }

        String tokenHash = sha256Hex(refreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

        // deviceId까지 확인(권장)
        if (req.getDeviceId() != null && !req.getDeviceId().isBlank()) {
            if (!req.getDeviceId().equals(stored.getDeviceId())) {
                throw new BusinessException(ErrorCode.DEVICE_MISMATCH);
            }
        }

        stored.revokeNow();
    }

    @Override
    public void logoutAll(String userId) {
        refreshTokenRepository.revokeAllActiveByUserId(userId, LocalDateTime.now());
    }

    private void saveRefreshToken(User user, String refreshToken, String deviceId, String userAgent, String ip) {
        LocalDateTime expiresAt = jwtProvider.getExpirationAsLocalDateTime(refreshToken); // 없으면 JwtProvider에 추가

        RefreshToken rt = RefreshToken.builder()
                .refreshTokenId(UUID.randomUUID().toString())
                .user(user)
                .tokenHash(sha256Hex(refreshToken))
                .deviceId(deviceId)
                .userAgent(userAgent)
                .ip(ip)
                .issuedAt(LocalDateTime.now())
                .expiresAt(expiresAt)
                .revoked(false)
                .build();

        refreshTokenRepository.save(rt);
    }

    private String sha256Hex(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] dig = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(dig);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }
    }

    private String safeUserId() {
        try {
            return idGenerator.generate("u_"); // IdGenerator가 이런 형태면 사용
        } catch (Exception ignore) {
            return "u_" + UUID.randomUUID();
        }
    }
}
