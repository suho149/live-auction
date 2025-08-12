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

                        // 1. 누구나 접근 가능한 경로
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/products",          // 상품 목록 조회
                                "/api/v1/products/{productId}", // 상품 상세 조회
                                "/api/v1/products/{productId}/qna", // Q&A 목록 조회
                                "/api/v1/users/{userId}/profile"  // 사용자 프로필 조회
                        ).permitAll()
                        .requestMatchers(
                                "/images/**",
                                "/",
                                "/oauth2/**",
                                "/login/oauth2/code/google",
                                "/api/v1/auth/reissue",
                                "/ws-stomp/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // 2. 관리자(ADMIN)만 접근 가능한 경로
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

                        // 3. 일반 사용자(USER)와 관리자(ADMIN) 모두 접근 가능한 경로
                        .requestMatchers(
                                "/api/v1/keywords/**",
                                "/api/v1/notifications/**",
                                "/api/v1/payments/**",
                                "/api/v1/chat/**",
                                "/api/v1/users/me/**",
                                "/api/v1/deliveries/**" // 배송 관련 API
                        ).hasAnyRole("USER", "ADMIN")

                        // ★★★ 이 부분을 수정합니다 ★★★
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/products",                      // 상품 등록
                                "/api/v1/images/upload",                 // 이미지 업로드
                                "/api/v1/products/{productId}/like",       // 좋아요
                                "/api/v1/products/{productId}/buy-now/payment-info", // 즉시구매
                                "/api/v1/products/{productId}/qna",        // 질문 작성
                                "/api/v1/products/{productId}/qna/{questionId}/answer", // 답변 작성
                                "/api/v1/products/{productId}/end-auction" // 조기 종료
                        ).hasAnyRole("USER", "ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/v1/products/{productId}/payment" // 결제 취소
                        ).hasAnyRole("USER", "ADMIN")

                        // 4. 위에서 정의한 경로 외의 모든 GET 요청은 인증만 되면 접근 가능
                        // (예: /api/v1/users/{userId}/profile)
                        .requestMatchers(HttpMethod.GET, "/api/v1/**").authenticated()

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