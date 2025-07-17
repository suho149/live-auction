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


    // 이 아래의 모든 목록 조회 쿼리들은 ToMany 관계인 'images'에 대한 Fetch Join이 없습니다. ★★★
    // ToOne 관계인 'seller'에 대한 Fetch Join은 성능에 유리하므로 그대로 둡니다.

    // 1. 키워드 검색 (카테고리 필터 없음)
    @Query(value = "SELECT p FROM Product p JOIN FETCH p.seller WHERE p.name LIKE %:keyword% OR p.description LIKE %:keyword%",
            countQuery = "SELECT count(p) FROM Product p WHERE p.name LIKE %:keyword% OR p.description LIKE %:keyword%")
    Page<Product> findByKeywordWithSeller(@Param("keyword") String keyword, Pageable pageable);

    // 2. 카테고리 + 키워드 검색
    @Query(value = "SELECT p FROM Product p JOIN FETCH p.seller WHERE p.category = :category AND (p.name LIKE %:keyword% OR p.description LIKE %:keyword%)",
            countQuery = "SELECT count(p) FROM Product p WHERE p.category = :category AND (p.name LIKE %:keyword% OR p.description LIKE %:keyword%)")
    Page<Product> findByCategoryAndKeywordWithSeller(@Param("category") Category category, @Param("keyword") String keyword, Pageable pageable);

    // 3. 카테고리만 필터링 (키워드 없음)
    @Query(value = "SELECT p FROM Product p JOIN FETCH p.seller WHERE p.category = :category",
            countQuery = "SELECT count(p) FROM Product p WHERE p.category = :category")
    Page<Product> findByCategoryWithSeller(@Param("category") Category category, Pageable pageable);

    // 4. 필터링 없이 전체 조회 (키워드, 카테고리 모두 없음)
    @Query(value = "SELECT p FROM Product p JOIN FETCH p.seller",
            countQuery = "SELECT count(p) FROM Product p")
    Page<Product> findAllWithSeller(Pageable pageable);

    // 단 건 조회인 상세 조회(findByIdWithDetails)는 모든 연관관계를 JOIN FETCH 하는 것이 효율적입니다. ★★★
    // 이 부분은 수정할 필요 없이 그대로 둡니다.
    @Query("SELECT p FROM Product p " +
            "JOIN FETCH p.seller " +
            "LEFT JOIN FETCH p.highestBidder " +
            "LEFT JOIN FETCH p.images " +
            "WHERE p.id = :productId")
    Optional<Product> findByIdWithDetails(@Param("productId") Long productId);

    // 수정/삭제 시 사용할, seller를 함께 fetch하는 메소드 추가
    @Query("SELECT p FROM Product p JOIN FETCH p.seller WHERE p.id = :productId")
    Optional<Product> findByIdWithSeller(@Param("productId") Long productId);
}