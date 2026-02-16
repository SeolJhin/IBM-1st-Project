package org.myweb.uniplace.global.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
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

    // ✅ properties 기준: ms
    private final long accessExpMs;
    private final long refreshExpMs;

    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-exp}") long accessExpMs,
            @Value("${jwt.refresh-exp}") long refreshExpMs
    ) {
        // secret이 base64로 관리되는 경우를 대비해 decode 시도 -> 실패하면 raw bytes로 처리
        this.key = buildHmacKey(secret);
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
                .signWith(key)
                .compact();
    }

    public String createRefreshToken(String userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId)
                .claim("typ", "refresh")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(refreshExpMs)))
                .signWith(key)
                .compact();
    }

    /**
     * 토큰 서명/만료/형식 검증
     */
    public void validate(String token) {
        try {
            parseClaims(token);
        } catch (ExpiredJwtException e) {
            throw new BusinessException(ErrorCode.TOKEN_EXPIRED);
        } catch (JwtException | IllegalArgumentException e) {
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

    public String getRole(String accessToken) {
        Object role = parseClaims(accessToken).get("role");
        return role == null ? null : String.valueOf(role);
    }

    public LocalDateTime getExpirationAsLocalDateTime(String token) {
        Date exp = parseClaims(token).getExpiration();
        return LocalDateTime.ofInstant(exp.toInstant(), ZoneId.systemDefault());
    }

    /**
     * ✅ JJWT 0.12.6 방식
     * - parserBuilder() 없음
     * - parser().verifyWith(key).build().parseSignedClaims(token).getPayload()
     */
    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * secret이 "base64 인코딩 문자열"일 수도 있고
     * "그냥 긴 문자열"일 수도 있어서 둘 다 대응.
     */
    private SecretKey buildHmacKey(String secret) {
        // 1) base64로 보이면 decode 시도
        try {
            byte[] decoded = Decoders.BASE64.decode(secret);
            // 너무 짧으면(HS256은 32바이트 이상 권장) raw로 fallback
            if (decoded.length >= 32) {
                return Keys.hmacShaKeyFor(decoded);
            }
        } catch (Exception ignored) {
            // not base64 -> fallback
        }

        // 2) 일반 문자열 처리
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
