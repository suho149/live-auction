package com.suho149.liveauction.domain.notification.repository;

import com.suho149.liveauction.domain.notification.entity.Notification;
import com.suho149.liveauction.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 사용자의 모든 알림을 최신순으로 조회
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    // 사용자의 읽지 않은 알림 개수 조회
    long countByUserIdAndIsReadFalse(Long userId);

    Optional<Notification> findFirstByUserAndUrlAndIsReadFalse(User user, String url);

    // 사용자의 모든 읽지 않은 알림 목록을 가져옴
    List<Notification> findAllByUserIdAndIsReadFalse(Long userId);
}
