package com.suho149.liveauction.domain.user.service;

import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.entity.ProductStatus;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import com.suho149.liveauction.domain.user.dto.ReviewRequest;
import com.suho149.liveauction.domain.user.dto.ReviewResponse;
import com.suho149.liveauction.domain.user.entity.Review;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.ReviewRepository;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createReview(Long productId, ReviewRequest request, UserPrincipal reviewerPrincipal) {
        // 상품 조회
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("리뷰 작성 실패: 상품을 찾을 수 없습니다. ID: " + productId));

        // 리뷰 작성자 조회
        User reviewer = userRepository.findById(reviewerPrincipal.getId())
                .orElseThrow(() -> new UsernameNotFoundException("리뷰 작성 실패: 인증된 사용자 정보를 DB에서 찾을 수 없습니다. ID: " + reviewerPrincipal.getId()));

        // 1. 거래가 완료된 상품인지 확인
        if (product.getStatus() != ProductStatus.SOLD_OUT) {
            throw new IllegalStateException("거래가 완료된 상품에 대해서만 리뷰를 작성할 수 있습니다.");
        }

        // 2. 리뷰 대상자(reviewee) 결정
        User reviewee;
        if (product.getSeller().getId().equals(reviewer.getId())) {
            // 내가 판매자 -> 구매자에게 리뷰 작성
            reviewee = product.getHighestBidder();
        } else if (product.getHighestBidder().getId().equals(reviewer.getId())) {
            // 내가 구매자 -> 판매자에게 리뷰 작성
            reviewee = product.getSeller();
        } else {
            throw new IllegalStateException("해당 거래의 당사자만 리뷰를 작성할 수 있습니다.");
        }

        // 3. 이미 리뷰를 작성했는지 확인
        if (reviewRepository.existsByReviewerIdAndProductId(reviewer.getId(), productId)) {
            throw new IllegalStateException("이미 이 거래에 대한 리뷰를 작성했습니다.");
        }

        // 4. 리뷰 생성 및 저장
        Review review = Review.builder()
                .reviewer(reviewer).reviewee(reviewee).product(product)
                .rating(request.getRating()).comment(request.getComment())
                .build();
        reviewRepository.save(review);

        // 5. 리뷰 받은 사용자의 평점 업데이트
        reviewee.addReview(request.getRating());
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyReviews(UserPrincipal userPrincipal) {
        return reviewRepository.findByRevieweeIdOrderByIdDesc(userPrincipal.getId())
                .stream().map(ReviewResponse::new).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyWrittenReviews(UserPrincipal userPrincipal) {
        return reviewRepository.findByReviewerIdOrderByIdDesc(userPrincipal.getId())
                .stream()
                .map(ReviewResponse::new) // 기존 ReviewResponse 재사용
                .collect(Collectors.toList());
    }
}
