package com.suho149.liveauction.domain.product.dto;

import com.suho149.liveauction.domain.product.entity.Product;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ProductResponse {
    private Long id;
    private String name;
    private Long currentPrice;
    private String imageUrl;
    private LocalDateTime auctionEndTime;
    private String sellerName;

    public static ProductResponse from(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .currentPrice(product.getCurrentPrice())
                .imageUrl(product.getImageUrl())
                .auctionEndTime(product.getAuctionEndTime())
                .sellerName(product.getSeller().getName())
                .build();
    }
}
