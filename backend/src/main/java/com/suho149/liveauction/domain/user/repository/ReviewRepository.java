package com.suho149.liveauction.domain.user.repository;

import com.suho149.liveauction.domain.user.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    // 특정 사용자가 받은 모든 리뷰를 조회
    List<Review> findByRevieweeIdOrderByIdDesc(Long revieweeId);

    // 특정 사용자가 작성한 모든 리뷰를 조회
    List<Review> findByReviewerIdOrderByIdDesc(Long reviewerId);

    // 특정 거래에 대해 특정 사용자가 이미 리뷰를 작성했는지 확인
    boolean existsByReviewerIdAndProductId(Long reviewerId, Long productId);
}
