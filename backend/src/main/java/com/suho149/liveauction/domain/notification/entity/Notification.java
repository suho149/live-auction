package com.suho149.liveauction.domain.notification.entity;

import com.suho149.liveauction.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // 알림을 받는 사용자

    @Column(nullable = false)
    private String content; // 알림 내용

    private String url; // 클릭 시 이동할 URL

    @Column(nullable = false)
    private boolean isRead = false; // 읽음 여부

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    private NotificationType type; // 알림 타입

    @Builder
    public Notification(User user, String content, String url, NotificationType type) {
        this.user = user;
        this.content = content;
        this.url = url;
        this.type = type;
        this.createdAt = LocalDateTime.now();
    }

    public void read() {
        this.isRead = true;
    }
}
