package com.suho149.liveauction.domain.keyword.repository;

import com.suho149.liveauction.domain.keyword.entity.Keyword;
import com.suho149.liveauction.domain.user.entity.User;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface KeywordRepository extends JpaRepository<Keyword, Long> {
    List<Keyword> findByUserId(Long userId);

    // 특정 키워드를 포함하는 상품이 등록되었을 때, 해당 키워드를 등록한 모든 사용자를 찾기 위한 쿼리
    @Query("SELECT k.user FROM Keyword k WHERE :text LIKE CONCAT('%', k.keyword, '%')")
    List<User> findUsersByKeywordIn(@Param("text") String text);
}
