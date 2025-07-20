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
    private List<String> imageUrls; // ★ 다중 이미지 URL 목록
    private Category category; // ★ 카테고리 추가
    private LocalDateTime auctionEndTime;
    private String sellerName;
    private String highestBidderName;
    private int likeCount;
    private boolean likedByCurrentUser;
    private boolean isSeller;
    private ProductStatus status;

    public static ProductDetailResponse from(Product product, boolean likedByCurrentUser, boolean isSeller) {
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
                .highestBidderName(product.getHighestBidder() != null ? product.getHighestBidder().getName() : "입찰자 없음")
                .likeCount(product.getLikeCount())
                .likedByCurrentUser(likedByCurrentUser)
                .isSeller(isSeller)
                .status(product.getStatus())
                .build();
    }
}

