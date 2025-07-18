package com.suho149.liveauction.domain.notification.dto;

import com.suho149.liveauction.domain.notification.entity.Notification;
import com.suho149.liveauction.domain.notification.entity.NotificationType;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class NotificationResponse {
    private final Long id;
    private final String content;
    private final String url;
    private final boolean isRead;
    private final LocalDateTime createdAt;
    private final NotificationType type;

    public NotificationResponse(Notification notification) {
        this.id = notification.getId();
        this.content = notification.getContent();
        this.url = notification.getUrl();
        this.isRead = notification.isRead();
        this.createdAt = notification.getCreatedAt();
        this.type = notification.getType();
    }
}
