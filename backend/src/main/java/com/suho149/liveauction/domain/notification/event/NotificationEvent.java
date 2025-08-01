package com.suho149.liveauction.domain.notification.event;

import com.suho149.liveauction.domain.notification.entity.NotificationType;
import lombok.Getter;

@Getter
public class NotificationEvent {
    private final Long userId; // User 엔티티 대신 userId (Long)
    private final NotificationType type;
    private final String content;
    private final String url;

    public NotificationEvent(Long userId, NotificationType type, String content, String url) {
        this.userId = userId;
        this.type = type;
        this.content = content;
        this.url = url;
    }
}
