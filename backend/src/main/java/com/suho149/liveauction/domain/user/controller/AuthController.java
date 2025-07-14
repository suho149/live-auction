package com.suho149.liveauction.domain.user.controller;

import com.suho149.liveauction.domain.user.service.AuthService;
import com.suho149.liveauction.global.jwt.dto.TokenDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/reissue")
    public ResponseEntity<TokenDTO> reissue(@RequestBody TokenDTO requestDTO) {
        TokenDTO newTokens = authService.reissue(requestDTO);
        return ResponseEntity.ok(newTokens);
    }
}
