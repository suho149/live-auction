package com.suho149.liveauction.domain.user.controller;

import com.suho149.liveauction.domain.user.dto.ReviewRequest;
import com.suho149.liveauction.domain.user.dto.ReviewResponse;
import com.suho149.liveauction.domain.user.service.ReviewService;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;

    @PostMapping("/products/{productId}/reviews")
    public ResponseEntity<Void> createReview(@PathVariable Long productId, @RequestBody ReviewRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        reviewService.createReview(productId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/users/me/reviews")
    public ResponseEntity<List<ReviewResponse>> getMyReviews(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(reviewService.getMyReviews(principal));
    }
}
