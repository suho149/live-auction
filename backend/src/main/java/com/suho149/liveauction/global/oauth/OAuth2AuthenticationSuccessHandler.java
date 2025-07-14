package com.suho149.liveauction.global.oauth;

import com.suho149.liveauction.global.jwt.JwtTokenProvider;
import com.suho149.liveauction.global.jwt.dto.TokenDTO;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        // TokenDTO 생성
        TokenDTO tokenDTO = jwtTokenProvider.generateToken(authentication);

        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/auth/callback")
                .queryParam("accessToken", tokenDTO.getAccessToken())
                .queryParam("refreshToken", tokenDTO.getRefreshToken())
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
