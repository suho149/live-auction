package com.suho149.liveauction.global.config;

import com.suho149.liveauction.global.jwt.JwtAuthenticationFilter;
import com.suho149.liveauction.global.oauth.CustomOAuth2UserService;
import com.suho149.liveauction.global.oauth.OAuth2AuthenticationSuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CSRF, Form Login, HTTP Basic 비활성화
                .csrf(csrf -> csrf.disable())
                .formLogin(formLogin -> formLogin.disable())
                .httpBasic(httpBasic -> httpBasic.disable())

                // ★★★ CORS 설정 추가 ★★★
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 세션을 사용하지 않으므로 STATELESS로 설정
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(unauthorizedEntryPoint()) // ★ 인증 실패 시 처리 로직 변경
                )

                // === URL 별 권한 관리 ===
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ★ 상품 조회 관련 GET 요청은 모두 허용
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/products",
                                "/api/v1/products/**",
                                "/images/**"  // 이미지 파일은 누구나 볼 수 있어야 함
                        ).permitAll()

                        .requestMatchers(
                                "/",
                                "/oauth2/**",
                                "/login/oauth2/code/google",
                                "/api/v1/auth/reissue",
                                "/ws-stomp/**"
                        ).permitAll()

                        .requestMatchers("/api/v1/keywords/**", "/api/v1/notifications/**", "/api/v1/payments/**").hasRole("USER")

                        .requestMatchers(HttpMethod.POST, "/api/v1/products", "/api/v1/images/upload").hasRole("USER")

                        .anyRequest().authenticated()
                )

                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2AuthenticationSuccessHandler)
                )

                // === 우리가 만든 필터를 security filter chain 에 추가 ===
                // UsernamePasswordAuthenticationFilter 이전에 JwtAuthenticationFilter 를 실행
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 인증 실패(401) 시 응답을 커스터마이징하기 위한 Bean
    @Bean
    public AuthenticationEntryPoint unauthorizedEntryPoint() {
        return (request, response, authException) ->
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
    }

    // CORS 설정 소스를 Bean으로 등록
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000")); // 프론트엔드 출처 허용
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}