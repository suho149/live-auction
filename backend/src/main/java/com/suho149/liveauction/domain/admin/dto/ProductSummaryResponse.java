package com.suho149.liveauction.domain.admin.dto;

import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.entity.ProductStatus;
import lombok.Getter;

@Getter
public class ProductSummaryResponse {
    private final Long id;
    private final String name;
    private final String sellerName;
    private final Long currentPrice;
    private final ProductStatus status;

    private ProductSummaryResponse(Product product) {
        this.id = product.getId();
        this.name = product.getName();
        this.sellerName = product.getSeller().getName();
        this.currentPrice = product.getCurrentPrice();
        this.status = product.getStatus();
    }

    /**
     * Product 엔티티를 ProductSummaryResponse DTO로 변환하는 정적 팩토리 메소드
     */
    public static ProductSummaryResponse from(Product product) {
        return new ProductSummaryResponse(product);
    }
}