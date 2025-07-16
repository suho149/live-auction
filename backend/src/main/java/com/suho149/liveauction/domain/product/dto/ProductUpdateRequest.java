package com.suho149.liveauction.domain.product.dto;

import com.suho149.liveauction.domain.product.entity.Category;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductUpdateRequest {
    private String name;
    private String description;
    private Category category;
}
