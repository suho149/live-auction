package com.suho149.liveauction.domain.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.suho149.liveauction.domain.notification.entity.Notification;
import com.suho149.liveauction.domain.notification.entity.NotificationType;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class NotificationResponse {
    private final Long id;
    private final String content;
    private final String url;
    private final LocalDateTime createdAt;
    private final NotificationType type;
    private final int unreadCount;

    @JsonProperty("isRead")
    private final boolean isRead;

    // 생성자를 사용하여 Notification 엔티티를 DTO로 변환
    public NotificationResponse(Notification notification) {
        this.id = notification.getId();
        this.content = notification.getContent();
        this.url = notification.getUrl();
        this.isRead = notification.isRead();
        this.createdAt = notification.getCreatedAt();
        this.type = notification.getType();
        this.unreadCount = notification.getUnreadCount(); // ★ unreadCount 값 매핑
    }
}
