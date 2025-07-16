package com.suho149.liveauction.domain.product.repository;

import com.suho149.liveauction.domain.product.entity.Category;
import com.suho149.liveauction.domain.product.entity.Product;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // N+1 문제 해결을 위한 Fetch Join 적용 (전체 목록 조회)
    @Query("SELECT p FROM Product p JOIN FETCH p.seller")
    List<Product> findAllWithSeller();

    // 카테고리로 필터링하고 페이징/정렬 적용
    @Query(value = "SELECT p FROM Product p JOIN FETCH p.seller WHERE p.category = :category",
            countQuery = "SELECT count(p) FROM Product p WHERE p.category = :category")
    Page<Product> findByCategoryWithSeller(@Param("category") Category category, Pageable pageable);

    // 페이징/정렬만 적용 (카테고리 'ALL'일 때 사용)
    @Query(value = "SELECT p FROM Product p JOIN FETCH p.seller",
            countQuery = "SELECT count(p) FROM Product p")
    Page<Product> findAllWithSeller(Pageable pageable);

    // 상세 조회 시, 연관된 모든 엔티티를 한번에 가져오도록 Fetch Join 적용
    @Query("SELECT p FROM Product p JOIN FETCH p.seller LEFT JOIN FETCH p.highestBidder LEFT JOIN FETCH p.images WHERE p.id = :productId")
    Optional<Product> findByIdWithDetails(@Param("productId") Long productId);

    // 검색어를 포함하는 상품을 찾는 쿼리 추가
    // 카테고리가 'ALL'일 때 사용
    @Query(value = "SELECT p FROM Product p JOIN FETCH p.seller WHERE p.name LIKE %:keyword% OR p.description LIKE %:keyword%",
            countQuery = "SELECT count(p) FROM Product p WHERE p.name LIKE %:keyword% OR p.description LIKE %:keyword%")
    Page<Product> findByKeywordWithSeller(@Param("keyword") String keyword, Pageable pageable);

    // 카테고리 필터와 검색어를 모두 사용할 때
    @Query(value = "SELECT p FROM Product p JOIN FETCH p.seller WHERE p.category = :category AND (p.name LIKE %:keyword% OR p.description LIKE %:keyword%)",
            countQuery = "SELECT count(p) FROM Product p WHERE p.category = :category AND (p.name LIKE %:keyword% OR p.description LIKE %:keyword%)")
    Page<Product> findByCategoryAndKeywordWithSeller(@Param("category") Category category, @Param("keyword") String keyword, Pageable pageable);
}
