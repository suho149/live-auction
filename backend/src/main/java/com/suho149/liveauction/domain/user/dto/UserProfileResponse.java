package com.suho149.liveauction.domain.user.dto;

import com.suho149.liveauction.domain.product.dto.ProductResponse;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class UserProfileResponse {
    private final Long userId;
    private final String name;
    private final String profileImageUrl;
    private final double ratingScore;
    private final int reviewCount;
    private final int salesCount;
    private final List<ReviewResponse> reviews; // 받은 리뷰 목록
    private final List<ProductResponse> sellingProducts; // 현재 판매 중인 상품 목록
}