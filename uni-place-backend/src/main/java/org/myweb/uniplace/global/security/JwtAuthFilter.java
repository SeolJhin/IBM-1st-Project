package org.myweb.uniplace.global.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    public JwtAuthFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        // 토큰 없으면 그냥 통과 (public API 허용 위해)
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        // 1️⃣ 토큰 유효성 검증 (만료/위조 등)
        jwtProvider.validate(token);

        // 2️⃣ access 토큰인지 확인
        String typ = jwtProvider.getTokenType(token);
        if (!"access".equals(typ)) {
            throw new BusinessException(ErrorCode.TOKEN_TYPE_INVALID);
        }

        // 3️⃣ 🔥 JwtProvider에서 Authentication 생성 (ROLE_ 권한 포함)
        Authentication authentication = jwtProvider.getAuthentication(token);

        // 4️⃣ SecurityContext에 저장
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }
}