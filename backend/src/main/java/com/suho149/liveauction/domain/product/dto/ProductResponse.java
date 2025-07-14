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
    private String thumbnailUrl; // ★ 대표 이미지(첫 번째 이미지)
    private LocalDateTime auctionEndTime;
    private String sellerName;

    public static ProductResponse from(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .currentPrice(product.getCurrentPrice())
                // 이미지가 없는 경우를 대비한 방어 코드
                .thumbnailUrl(product.getImages().isEmpty() ? null : product.getImages().get(0).getImageUrl())
                .auctionEndTime(product.getAuctionEndTime())
                .sellerName(product.getSeller().getName())
                .build();
    }
}
