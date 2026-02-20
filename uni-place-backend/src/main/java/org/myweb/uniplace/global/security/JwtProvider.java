package org.myweb.uniplace.global.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

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
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpMs = accessExpMs;
        this.refreshExpMs = refreshExpMs;
    }

    public String createAccessToken(String userId, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId)
                .claim("role", role)
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
}
