package com.suho149.liveauction.domain.product.dto;

import com.suho149.liveauction.domain.product.entity.Category;
import com.suho149.liveauction.domain.product.entity.ProductStatus;
import lombok.Data;

import java.util.List;

@Data // Getter, Setter, ToString 등을 모두 포함
public class ProductSearchCondition {
    private String keyword;
    private String sellerName;
    private Category category;
    private Long minPrice;
    private Long maxPrice;
    private List<ProductStatus> statuses;
    // 관리자가 삭제된 상품을 포함하여 조회할지 여부를 나타내는 플래그
    private boolean includeDeleted = false;
    // 정렬 조건 등 추가 가능
}
