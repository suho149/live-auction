package com.suho149.liveauction.domain.product.dto;

import com.suho149.liveauction.domain.product.entity.Product;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ProductDetailResponse {
    private Long id;
    private String name;
    private String description;
    private Long currentPrice;
    private String imageUrl;
    private LocalDateTime auctionEndTime;
    private String sellerName;
    private String highestBidderName;

    public static ProductDetailResponse from(Product product) {
        return ProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .currentPrice(product.getCurrentPrice())
                .imageUrl(product.getImageUrl())
                .auctionEndTime(product.getAuctionEndTime())
                .sellerName(product.getSeller().getName())
                .highestBidderName(product.getHighestBidder() != null ? product.getHighestBidder().getName() : "입찰자 없음")
                .build();
    }
}
