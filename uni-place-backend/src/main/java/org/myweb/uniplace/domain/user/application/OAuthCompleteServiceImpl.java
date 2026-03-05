package org.myweb.uniplace.domain.user.application;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.user.api.dto.request.KakaoSignupCompleteRequest;
import org.myweb.uniplace.domain.user.api.dto.response.UserTokenResponse;
import org.myweb.uniplace.domain.user.domain.entity.RefreshToken;
import org.myweb.uniplace.domain.user.domain.entity.SocialAccount;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.domain.enums.UserRole;
import org.myweb.uniplace.domain.user.domain.enums.UserStatus;
import org.myweb.uniplace.domain.user.repository.RefreshTokenRepository;
import org.myweb.uniplace.domain.user.repository.SocialAccountRepository;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.security.JwtProvider;import org.myweb.uniplace.global.util.IdGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OAuthCompleteServiceImpl implements OAuthCompleteService {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    @Value("${jwt.refresh-exp:86400000}")
    private long refreshExpMillis;

    @Override
    @Transactional
    public UserTokenResponse kakaoComplete(KakaoSignupCompleteRequest req, String userAgent, String ip) {
        Claims claims = jwtProvider.validateOauthSignupToken(req.getSignupToken());

        String provider = asText(claims.get("provider"));
        String providerId = asText(claims.get("providerId"));
        String providerEmail = normalizeEmail(asText(claims.get("email")));
        String nickname = asText(claims.get("nickname"));

        if (!hasText(provider) || !hasText(providerId)) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }

        String providerUpper = provider.toUpperCase();
        String providerLower = provider.toLowerCase();

        if (socialAccountRepository.existsByProviderAndProviderUserId(providerUpper, providerId)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        if (!hasText(req.getUserTel()) || req.getUserBirth() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        String userTel = req.getUserTel().trim();
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
        String name = hasText(req.getUserNm()) ? req.getUserNm().trim() : (nickname != null ? nickname : "user");

        String fallbackEmail = providerLower + "_" + providerId + "@social.local";
        String resolvedEmail = hasText(providerEmail) ? providerEmail : fallbackEmail;
        if (userRepository.existsByUserEmail(resolvedEmail)) {
            resolvedEmail = fallbackEmail;
        }

        String encodedPwd = passwordEncoder.encode(req.getUserPwd());

        User user = User.builder()
            .userId(userId)
            .userNm(name)
            .userNickname(userNickname)
            .userEmail(resolvedEmail)
            .userPwd(encodedPwd)
            .userBirth(req.getUserBirth())
            .userTel(userTel)
            .userRole(UserRole.user)
            .userSt(UserStatus.active)
            .deleteYN("N")
            .build();

        userRepository.save(user);

        user.markAdditionalInfoCompleted();
        userRepository.save(user);

        SocialAccount sa = SocialAccount.builder()
            .user(user)
            .provider(providerUpper)
            .providerUserId(providerId)
            .providerEmail(providerEmail)
            .build();

        socialAccountRepository.save(sa);
        notifySocialLinked(user.getUserId(), providerUpper);

        String accessToken = jwtProvider.createAccessToken(userId, user.getUserRole().name());
        String refreshToken = jwtProvider.createRefreshToken(userId);

        String tokenHash = sha256Hex(refreshToken);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(refreshExpMillis / 1000);

        RefreshToken rt = RefreshToken.builder()
            .refreshTokenId(IdGenerator.generate("RTK"))
            .user(user)
            .tokenHash(tokenHash)
            .deviceId(providerUpper)
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
            .deviceId(providerUpper)
            .additionalInfoRequired(false)
            .build();
    }

    @Override
    @Transactional
    public UserTokenResponse googleComplete(KakaoSignupCompleteRequest req, String userAgent, String ip) {
        return kakaoComplete(req, userAgent, ip);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String asText(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value);
        return text.isBlank() ? null : text;
    }

    private static String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase();
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

    private void notifySocialLinked(String userId, String provider) {
        if (!hasText(userId)) {
            return;
        }
        try {
            notificationService.notifyUser(
                userId,
                NotificationType.SEC_SOCIAL_LINK.name(),
                "소셜 계정 연동이 완료되었습니다. (provider=" + provider + ")",
                null,
                TargetType.security,
                null,
                "/mypage/security"
            );
        } catch (Exception e) {
            log.warn("[AUTH][NOTIFY] social link notify failed userId={} reason={}", userId, e.getMessage());
        }
    }
}
