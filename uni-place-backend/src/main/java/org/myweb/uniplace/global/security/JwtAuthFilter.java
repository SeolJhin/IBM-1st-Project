package org.myweb.uniplace.global.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtProvider jwtProvider, UserRepository userRepository) {
        this.jwtProvider = jwtProvider;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        // No token: continue for public endpoints.
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        // 1) Signature/expiration validation.
        jwtProvider.validate(token);

        // 2) Access token type validation.
        String typ = jwtProvider.getTokenType(token);
        if (!"access".equals(typ)) {
            throw new BusinessException(ErrorCode.TOKEN_TYPE_INVALID);
        }

        // 3) User state validation (active + not deleted).
        String userId = jwtProvider.getSubject(token);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        if (!user.canLogin()) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        // 4) Build authentication and set security context.
        Authentication authentication = jwtProvider.getAuthentication(token);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }
}
