package org.myweb.uniplace.domain.user.application;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
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
public class OAuthCompleteServiceImpl implements OAuthCompleteService {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final IdGenerator idGenerator;

    @Value("${jwt.refresh-exp:86400000}")
    private long refreshExpMillis;

    @Override
    @Transactional
    public UserTokenResponse kakaoComplete(KakaoSignupCompleteRequest req, String userAgent, String ip) {

        // 1) signupToken 검증 + 클레임 추출
        Claims claims = jwtProvider.validateOauthSignupToken(req.getSignupToken());

        String provider = String.valueOf(claims.get("provider"));         // "kakao"
        String providerId = String.valueOf(claims.get("providerId"));     // kakao id
        String providerEmail = (String) claims.get("email");
        String nickname = (String) claims.get("nickname");

        // 2) provider/providerId 로 이미 연동된 계정인지 체크
        if (socialAccountRepository.existsByProviderAndProviderUserId(provider.toUpperCase(), providerId)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST); // 이미 가입된 소셜계정
        }

        // 3) 추가정보 검증(필수값)
        if (req.getUserTel() == null || req.getUserTel().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        if (req.getUserBirth() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        if (userRepository.existsByUserTel(req.getUserTel())) {
            throw new BusinessException(ErrorCode.DUPLICATE_TEL);
        }

        // 4) User 생성
        String userId = idGenerator.generate("USR");
        String name = (req.getUserNm() != null && !req.getUserNm().isBlank())
                ? req.getUserNm()
                : (nickname != null ? nickname : "사용자");

        String dummyPwd = passwordEncoder.encode(idGenerator.generate("PWD"));

        User user = User.builder()
                .userId(userId)
                .userNm(name)
                .userEmail(providerEmail != null ? providerEmail : ("kakao_" + providerId + "@social.local"))
                .userPwd(dummyPwd)
                .userBirth(req.getUserBirth())
                .userTel(req.getUserTel())
                .userRole(UserRole.user)
                .userSt(UserStatus.active)
                .deleteYN("N")
                // ✅ kakaoComplete는 "추가정보 입력 완료" 요청이므로 완료 상태로 저장
                // (User 엔티티에 markAdditionalInfoCompleted()가 있으면 그걸 쓰는 게 더 깔끔하지만,
                //  builder 단계에선 setter가 없을 수 있으니 아래처럼 저장 후 메소드로 처리)
                .build();

        userRepository.save(user);

        // ✅ 추가정보 완료 플래그: N
        // (User 엔티티에 markAdditionalInfoCompleted() 메소드가 있어야 함)
        user.markAdditionalInfoCompleted();
        userRepository.save(user);

        // 5) social_accounts 저장
        SocialAccount sa = SocialAccount.builder()
                .user(user)
                .provider(provider.toUpperCase())     // "KAKAO"
                .providerUserId(providerId)
                .providerEmail(providerEmail)
                .build();

        socialAccountRepository.save(sa);

        // 6) JWT 발급 + refresh_tokens 저장
        String accessToken = jwtProvider.createAccessToken(userId, user.getUserRole().name());
        String refreshToken = jwtProvider.createRefreshToken(userId);

        String tokenHash = sha256Hex(refreshToken);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(refreshExpMillis / 1000);

        RefreshToken rt = RefreshToken.builder()
                .refreshTokenId(idGenerator.generate("RTK"))
                .user(user)
                .tokenHash(tokenHash)
                .deviceId("KAKAO") // 소셜 로그인은 고정값
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
                .deviceId("KAKAO")
                .additionalInfoRequired(false)
                .build();
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