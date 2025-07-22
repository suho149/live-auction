package com.suho149.liveauction.domain.product.dto;

import com.suho149.liveauction.domain.product.entity.Category;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.entity.ProductImage;
import com.suho149.liveauction.domain.product.entity.ProductStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class ProductDetailResponse {
    private Long id;
    private String name;
    private String description;
    private Long currentPrice;
    private List<String> imageUrls; // 다중 이미지 URL 목록
    private Category category; // 카테고리 추가
    private LocalDateTime auctionEndTime;
    private String sellerName;
    private final Long sellerId; // 판매자 ID 필드 추가
    private final double sellerRating; // 판매자 평균 평점
    private final int sellerSalesCount; // 판매자 판매 횟수
    private String highestBidderName;
    private int likeCount;
    private boolean likedByCurrentUser;
    private boolean isSeller;
    private ProductStatus status;
    private final LocalDateTime paymentDueDate;
    private final Long buyNowPrice;
    private final Long myAutoBidMaxAmount; // 나의 자동 입찰 설정액 (설정 안 했으면 null)
    private final long participantCount;

    public static ProductDetailResponse from(Product product, boolean likedByCurrentUser, boolean isSeller, Long myAutoBidMaxAmount, Long participantCount) {
        return ProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .currentPrice(product.getCurrentPrice())
                .imageUrls(product.getImages().stream()
                        .map(ProductImage::getImageUrl)
                        .collect(Collectors.toList()))
                .category(product.getCategory())
                .auctionEndTime(product.getAuctionEndTime())
                .sellerName(product.getSeller().getName())
                .sellerId(product.getSeller().getId())
                .sellerRating(product.getSeller().getRatingScore())
                .sellerSalesCount(product.getSeller().getSalesCount())
                .highestBidderName(product.getHighestBidder() != null ? product.getHighestBidder().getName() : "입찰자 없음")
                .likeCount(product.getLikeCount())
                .likedByCurrentUser(likedByCurrentUser)
                .isSeller(isSeller)
                .status(product.getStatus())
                .paymentDueDate(product.getPaymentDueDate())
                .buyNowPrice(product.getBuyNowPrice())
                .myAutoBidMaxAmount(myAutoBidMaxAmount)
                .participantCount(participantCount)
                .build();
    }
}

