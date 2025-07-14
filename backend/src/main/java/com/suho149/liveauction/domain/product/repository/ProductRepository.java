package com.suho149.liveauction.domain.product.repository;

import com.suho149.liveauction.domain.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // Fetch Join을 사용하여 N+1 문제 해결
    @Query("SELECT p FROM Product p JOIN FETCH p.seller")
    @Override
    List<Product> findAll();
}
