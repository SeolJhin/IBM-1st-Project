package org.myweb.uniplace.global.security;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.security.oauth.CustomOAuth2UserService;
import org.myweb.uniplace.global.security.oauth.OAuth2FailureHandler;
import org.myweb.uniplace.global.security.oauth.OAuth2SuccessHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2FailureHandler oAuth2FailureHandler;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        JwtAuthFilter jwtAuthFilter = new JwtAuthFilter(jwtProvider, userRepository);

        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(eh -> eh
                .authenticationEntryPoint(restAuthenticationEntryPoint)
                .accessDeniedHandler(restAccessDeniedHandler)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/signup").permitAll()
                .requestMatchers("/auth/login").permitAll()
                .requestMatchers("/auth/refresh").permitAll()
                .requestMatchers("/auth/logout").permitAll()
                .requestMatchers("/auth/oauth2/kakao/complete").permitAll()
                .requestMatchers("/auth/oauth2/google/complete").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers("/member/login").permitAll()
                .requestMatchers("/login/**").permitAll()
                .requestMatchers("/oauth2/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/swagger-ui/**", "/v4/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/payments/callback/*/approval").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/payments/callback/*/cancel").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/payments/callback/*/fail").permitAll()
                .requestMatchers("/api/payments/webhook/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/tour-reservations/rooms").permitAll()
                .requestMatchers(HttpMethod.GET, "/tour-reservations/slots").permitAll()
                .requestMatchers(HttpMethod.POST, "/tour-reservations").permitAll()
                .requestMatchers(HttpMethod.POST, "/tour-reservations/lookup").permitAll()
                .requestMatchers(HttpMethod.PUT, "/tour-reservations/cancel/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/buildings/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/buildings").permitAll()
                .requestMatchers(HttpMethod.GET, "/rooms/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/rooms").permitAll()
                .requestMatchers(HttpMethod.GET, "/spaces/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/spaces").permitAll()
                .requestMatchers(HttpMethod.GET, "/products").permitAll()
                .requestMatchers(HttpMethod.GET, "/products/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/reviews").permitAll()
                .requestMatchers(HttpMethod.GET, "/reviews/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/boards").permitAll()
                .requestMatchers(HttpMethod.GET, "/boards/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/reviews").hasRole("TENANT")
                .requestMatchers(HttpMethod.PUT, "/reviews/**").hasRole("TENANT")
                .requestMatchers(HttpMethod.DELETE, "/reviews/**").hasRole("TENANT")
                .requestMatchers(HttpMethod.GET, "/notices").permitAll()
                .requestMatchers(HttpMethod.GET, "/notices/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/notices").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/notices/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/notices/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/faqs").permitAll()
                .requestMatchers(HttpMethod.GET, "/faqs/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/faqs").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/faqs/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/faqs/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/complains/me").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/complains/me").authenticated()
                .requestMatchers(HttpMethod.GET, "/complains").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/complains").permitAll()
                .requestMatchers(HttpMethod.GET, "/complains/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/complains/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/complains").hasAnyRole("ADMIN", "TENANT")
                .requestMatchers(HttpMethod.POST, "/api/complains").hasAnyRole("ADMIN", "TENANT")
                .requestMatchers(HttpMethod.PUT, "/complains/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/complains/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/complains/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/complains/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/complains/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/complains/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/qna/all").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/qna").authenticated()
                .requestMatchers(HttpMethod.GET, "/qna/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/qna").hasAnyRole("ADMIN", "TENANT")
                .requestMatchers(HttpMethod.POST, "/qna/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/qna/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/qna/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/qna/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/files/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/files").permitAll()            
                .requestMatchers(HttpMethod.POST, "/files").permitAll()
                .requestMatchers("/auth/find-email").permitAll()
                .requestMatchers("/auth/reset-password/request").permitAll()
                .requestMatchers("/auth/reset-password/verify").permitAll()
                .requestMatchers("/auth/reset-password/confirm").permitAll()
                .requestMatchers(HttpMethod.DELETE, "/files").permitAll()
                .requestMatchers(HttpMethod.GET, "/admin/common-codes/PRODUCT_CATEGORY").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/login")
                .successHandler(oAuth2SuccessHandler)
                .failureHandler(oAuth2FailureHandler)
                .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/member/logout")
                .logoutSuccessUrl("/")
                .permitAll()
            );

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

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}