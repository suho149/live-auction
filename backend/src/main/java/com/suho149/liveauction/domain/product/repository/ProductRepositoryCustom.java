package com.suho149.liveauction.domain.product.repository;

import com.suho149.liveauction.domain.product.dto.ProductSearchCondition;
import com.suho149.liveauction.domain.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductRepositoryCustom {
    Page<Product> search(ProductSearchCondition condition, Pageable pageable);
}
