package com.suho149.liveauction.domain.user.repository;

import com.suho149.liveauction.domain.admin.dto.DailyStatsDto;
import com.suho149.liveauction.domain.user.entity.User;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, UserRepositoryCustom {

    Optional<User> findByEmail(String email);

    // 오늘 가입한 사용자 수
    long countByCreatedAtAfter(LocalDateTime dateTime);

    @Query(value = "SELECT CAST(u.created_at AS DATE), COUNT(u.id) " +
            "FROM users u WHERE u.created_at >= :startDate " +
            "GROUP BY CAST(u.created_at AS DATE) ORDER BY CAST(u.created_at AS DATE) ASC",
            nativeQuery = true)
    List<Object[]> findDailyUserSignups(@Param("startDate") LocalDateTime startDate);
}

