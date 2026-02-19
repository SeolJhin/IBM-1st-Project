package org.myweb.uniplace.global.security;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.global.security.oauth.CustomOAuth2UserService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtProvider jwtProvider;
    private final CustomOAuth2UserService customOAuth2UserService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        JwtAuthFilter jwtAuthFilter = new JwtAuthFilter(jwtProvider);

        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())

                // JWT 사용 → 세션 사용 안함
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .exceptionHandling(eh -> eh
                        .authenticationEntryPoint(new RestAuthenticationEntryPoint())
                        .accessDeniedHandler(new RestAccessDeniedHandler())
                )

                .authorizeHttpRequests(auth -> auth

                        // OAuth, Auth 관련 허용
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/login/**").permitAll()
                        .requestMatchers("/oauth2/**").permitAll()

                        // Swagger 허용
                        .requestMatchers(HttpMethod.GET,
                                "/swagger-ui/**",
                                "/v4/api-docs/**"
                        ).permitAll()

                        // Admin 권한
                        .requestMatchers("/admin/**").hasRole("ADMIN")

                        // 나머지는 인증 필요
                        .anyRequest().authenticated()
                )

                // ✅ OAuth2 로그인 설정 (이식 완료)
                .oauth2Login(oauth2 -> oauth2

                        // 로그인 페이지 (없으면 기본 사용)
                        .loginPage("/member/login")

                        // 성공 후 이동 (JWT 구조에서는 나중에 SuccessHandler로 대체 가능)
                        .defaultSuccessUrl("/member/loginsuccess")

                        // 핵심: 사용자 정보 처리 서비스
                        .userInfoEndpoint(userInfo ->
                                userInfo.userService(customOAuth2UserService)
                        )

                        .permitAll()
                )

                // logout 설정
                .logout(logout -> logout
                        .logoutUrl("/member/logout")
                        .logoutSuccessUrl("/")
                        .permitAll()
                );

        // JwtExceptionFilter → JwtAuthFilter 순서 중요
        http.addFilterBefore(new JwtExceptionFilter(), UsernamePasswordAuthenticationFilter.class);
        http.addFilterAfter(jwtAuthFilter, JwtExceptionFilter.class);

        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }

}
