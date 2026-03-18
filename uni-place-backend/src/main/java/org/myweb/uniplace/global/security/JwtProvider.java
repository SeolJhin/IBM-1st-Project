package org.myweb.uniplace.global.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Component
public class JwtProvider {

    private final SecretKey key;

    // application.properties 기준: jwt.access-exp / jwt.refresh-exp (ms)
    @Getter
    private final long accessExpMs;
    @Getter
    private final long refreshExpMs;

    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-exp}") long accessExpMs,
            @Value("${jwt.refresh-exp}") long refreshExpMs
    ) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("jwt.secret is required and must be at least 32 characters.");
        }
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("jwt.secret must be at least 32 bytes for HS256.");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpMs = accessExpMs;
        this.refreshExpMs = refreshExpMs;
    }

    public String createAccessToken(String userId, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId)
                .claim("role", role)          // 예: "admin" / "user" / "tenant"
                .claim("typ", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessExpMs)))
                .signWith(key, Jwts.SIG.HS256) // ✅ deprecated 아님
                .compact();
    }

    public String createRefreshToken(String userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId)
                .claim("typ", "refresh")
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(refreshExpMs)))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public void validate(String token) {
        try {
            parseClaims(token);
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            throw new BusinessException(ErrorCode.TOKEN_EXPIRED);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }
    }

    public String getSubject(String token) {
        return parseClaims(token).getSubject();
    }

    public String getTokenType(String token) {
        Object typ = parseClaims(token).get("typ");
        return typ == null ? null : String.valueOf(typ);
    }

    public String getRole(String token) {
        Object role = parseClaims(token).get("role");
        return role == null ? null : String.valueOf(role);
    }

    public LocalDateTime getExpirationAsLocalDateTime(String token) {
        Date exp = parseClaims(token).getExpiration();
        return LocalDateTime.ofInstant(exp.toInstant(), ZoneId.systemDefault());
    }

    /**
     * ✅ Spring Security Authorization(/admin/** hasRole('ADMIN'))이 동작하도록
     * JWT 안의 role("admin","user","tenant")을 GrantedAuthority("ROLE_ADMIN", ...)로 변환해서
     * Authentication을 생성해준다.
     *
     * - principal: AuthUser
     * - authorities: ROLE_ + 대문자 규칙 적용
     */
    public Authentication getAuthentication(String token) {
        String tokenType = getTokenType(token);
        if (!"access".equals(tokenType)) {
            // refresh/oauth-signup 토큰으로 보호 API 접근하면 차단
            throw new BusinessException(ErrorCode.TOKEN_TYPE_INVALID);
        }

        String userId = getSubject(token);
        String role = getRole(token); // "admin" / "user" / "tenant"

        if (userId == null || userId.isBlank()) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }
        if (role == null || role.isBlank()) {
            // role이 없으면 권한 체크가 불가능하니 invalid 처리(보안상 안전)
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }

        String authority = "ROLE_" + role.trim().toUpperCase(); // admin -> ROLE_ADMIN
        List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(authority));
        AuthUser authUser = new AuthUser(userId, role);
        return new UsernamePasswordAuthenticationToken(authUser, null, authorities);
    }

    private Claims parseClaims(String token) {
        // ✅ 0.12.x: parserBuilder 대신 parser() + verifyWith
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // ✅ 소셜 가입용 임시 토큰 생성 (5~10분짜리 추천)
    public String createOauthSignupToken(String provider,
                                         String providerId,
                                         String email,
                                         String nickname) {

        Instant now = Instant.now();

        return Jwts.builder()
                .claim("provider", provider)
                .claim("providerId", providerId)
                .claim("email", email)
                .claim("nickname", nickname)
                .claim("typ", "oauth-signup")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(10 * 60 * 1000))) // 10분
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    // ✅ 소셜 가입 전용 signupToken 검증
    public Claims validateOauthSignupToken(String token) {
        try {
            Claims claims = parseClaims(token);

            String typ = String.valueOf(claims.get("typ"));
            if (!"oauth-signup".equals(typ)) {
                throw new BusinessException(ErrorCode.TOKEN_TYPE_INVALID);
            }

            return claims;

        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            throw new BusinessException(ErrorCode.TOKEN_EXPIRED);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }
    }

    public String createOauthLinkToken(String userId, String provider) {
        Instant now = Instant.now();

        return Jwts.builder()
            .claim("userId", userId)
            .claim("provider", provider)
            .claim("typ", "oauth-link")
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusMillis(10 * 60 * 1000)))
            .signWith(key, Jwts.SIG.HS256)
            .compact();
    }

    public Claims validateOauthLinkToken(String token) {
        try {
            Claims claims = parseClaims(token);

            String typ = String.valueOf(claims.get("typ"));
            if (!"oauth-link".equals(typ)) {
                throw new BusinessException(ErrorCode.TOKEN_TYPE_INVALID);
            }

            return claims;

        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            throw new BusinessException(ErrorCode.TOKEN_EXPIRED);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }
    }
}
