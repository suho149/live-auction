package com.suho149.liveauction.domain.user.service;

import com.suho149.liveauction.global.jwt.JwtTokenProvider;
import com.suho149.liveauction.global.jwt.dto.TokenDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTemplate<String, Object> redisTemplate;

    @Transactional
    public TokenDTO reissue(TokenDTO requestDTO) {
        // 1. Refresh Token 검증
        if (!jwtTokenProvider.validateToken(requestDTO.getRefreshToken())) {
            throw new RuntimeException("Invalid Refresh Token.");
        }

        // 2. Access Token 에서 User ID 가져오기
        Authentication authentication = jwtTokenProvider.getAuthentication(requestDTO.getAccessToken());

        // 3. Redis 에서 User ID 를 기반으로 저장된 Refresh Token 값을 가져옴
        String refreshToken = (String) redisTemplate.opsForValue().get("RT:" + authentication.getName());
        if (refreshToken == null || !refreshToken.equals(requestDTO.getRefreshToken())) {
            throw new RuntimeException("Refresh Token does not match.");
        }

        // 4. 새로운 토큰 생성
        TokenDTO newTokenDTO = jwtTokenProvider.generateToken(authentication);

        // 5. 토큰 발급
        return newTokenDTO;
    }
}
