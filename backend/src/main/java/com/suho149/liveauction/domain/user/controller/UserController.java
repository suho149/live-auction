package com.suho149.liveauction.domain.user.controller;

import com.suho149.liveauction.domain.user.dto.UserResponse;
import com.suho149.liveauction.domain.user.service.UserService;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 현재 인증된 사용자의 정보를 반환합니다.
     * @param userPrincipal @AuthenticationPrincipal을 통해 주입된 사용자 정보
     * @return ResponseEntity<UserResponse>
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyInfo(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserResponse myInfo = userService.getMyInfo(userPrincipal);
        return ResponseEntity.ok(myInfo);
    }
}
