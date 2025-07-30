package com.suho149.liveauction.domain.user.repository;

import com.suho149.liveauction.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, UserRepositoryCustom {

    Optional<User> findByEmail(String email);

    // 오늘 가입한 사용자 수
    long countByCreatedAtAfter(LocalDateTime dateTime);
}

