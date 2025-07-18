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
    private User user;

    @Column(nullable = false, length = 255)
    private String content;

    // 안 읽은 메시지 개수를 저장할 필드
    private int unreadCount = 1;

    private String url;

    @Column(nullable = false)
    private boolean isRead = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

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

    public void updateContent(String newContent) {
        this.content = newContent;
        this.createdAt = LocalDateTime.now();
    }

    public void updateForChatNotification() {
        this.unreadCount++; // 안 읽은 개수 1 증가
        this.content = "새로운 메시지가 " + this.unreadCount + "개 도착했습니다.";
        this.createdAt = LocalDateTime.now(); // 최신 시간으로 업데이트
        this.isRead = false; // 혹시 읽음 처리되었을 수 있으니 다시 안 읽음 상태로
    }
}
