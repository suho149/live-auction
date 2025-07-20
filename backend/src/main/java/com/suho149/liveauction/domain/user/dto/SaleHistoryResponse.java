package com.suho149.liveauction.domain.user.dto;

import com.suho149.liveauction.domain.product.entity.Product;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SaleHistoryResponse {
    private final Long productId;
    private final String productName;
    private final String productThumbnailUrl;
    private final Long finalPrice;
    private final LocalDateTime soldAt; // 판매 완료 시간
    private final String buyerName; // 구매자 이름

    // Product 엔티티로부터 DTO를 생성. 판매 완료 시간은 Payment 엔티티에서 가져와야 함.
    public static SaleHistoryResponse from(Product product, LocalDateTime soldAt) {
        return SaleHistoryResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .productThumbnailUrl(
                        product.getImages().isEmpty() ?
                                null : product.getImages().get(0).getImageUrl()
                )
                .finalPrice(product.getCurrentPrice())
                .soldAt(soldAt)
                .buyerName(product.getHighestBidder() != null ? product.getHighestBidder().getName() : "정보 없음")
                .build();
    }
}
