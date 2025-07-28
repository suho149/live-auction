package com.suho149.liveauction.domain.product.repository;

import com.suho149.liveauction.domain.product.entity.Question;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    // 특정 상품의 모든 질문을 최신순으로 조회
    //List<Question> findByProductIdOrderByIdDesc(Long productId);

    @Query("SELECT q FROM Question q " +
            "JOIN FETCH q.author " +
            "JOIN FETCH q.product p " +
            "JOIN FETCH p.seller " +
            "WHERE q.product.id = :productId " +
            "ORDER BY q.id DESC")
    List<Question> findByProductIdWithDetails(@Param("productId") Long productId);
}
