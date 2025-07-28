package com.suho149.liveauction.domain.product.repository;

import com.suho149.liveauction.domain.product.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    // 특정 상품의 모든 질문을 최신순으로 조회
    List<Question> findByProductIdOrderByIdDesc(Long productId);
}
