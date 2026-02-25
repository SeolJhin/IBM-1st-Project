package org.myweb.uniplace.global.security;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.security.oauth.CustomOAuth2UserService;
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

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        JwtAuthFilter jwtAuthFilter = new JwtAuthFilter(jwtProvider, userRepository);

        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(eh -> eh
                .authenticationEntryPoint(new RestAuthenticationEntryPoint())
                .accessDeniedHandler(new RestAccessDeniedHandler())
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/signup").permitAll()
                .requestMatchers("/auth/login").permitAll()
                .requestMatchers("/auth/refresh").permitAll()
                .requestMatchers("/auth/logout").permitAll()
                .requestMatchers("/auth/oauth2/kakao/complete").permitAll()
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
                .requestMatchers(HttpMethod.GET, "/reviews").permitAll()
                .requestMatchers(HttpMethod.GET, "/reviews/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/notices").permitAll()
                .requestMatchers(HttpMethod.GET, "/notices/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/faqs").permitAll()
                .requestMatchers(HttpMethod.GET, "/faqs/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/files/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/files").permitAll()            
                .requestMatchers(HttpMethod.POST, "/files").permitAll()
                .requestMatchers(HttpMethod.DELETE, "/files").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/member/login")
                .successHandler(oAuth2SuccessHandler)
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
