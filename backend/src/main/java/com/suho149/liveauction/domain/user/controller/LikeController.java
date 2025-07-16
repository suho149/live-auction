package com.suho149.liveauction.domain.user.controller;

import com.suho149.liveauction.domain.user.dto.LikeResponse;
import com.suho149.liveauction.domain.user.service.LikeService;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products/{productId}/like")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    @PostMapping
    public ResponseEntity<LikeResponse> toggleLike(@PathVariable Long productId, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(likeService.toggleLike(productId, userPrincipal));
    }
}
