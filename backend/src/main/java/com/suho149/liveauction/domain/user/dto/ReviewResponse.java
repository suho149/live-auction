package com.suho149.liveauction.domain.user.dto;

import com.suho149.liveauction.domain.user.entity.Review;
import lombok.Getter;

@Getter
public class ReviewResponse {
    private final Long reviewId;
    private final String reviewerName;
    private final int rating;
    private final String comment;
    private final String productName;

    public ReviewResponse(Review review) {
        this.reviewId = review.getId();
        this.reviewerName = review.getReviewer().getName();
        this.rating = review.getRating();
        this.comment = review.getComment();
        this.productName = review.getProduct().getName();
    }
}
