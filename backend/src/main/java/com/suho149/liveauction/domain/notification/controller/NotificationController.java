package com.suho149.liveauction.domain.notification.controller;

import com.suho149.liveauction.domain.notification.dto.NotificationResponse;
import com.suho149.liveauction.domain.notification.service.NotificationService;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // SSE 구독 엔드포인트
    @GetMapping(value = "/api/v1/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) return null;
        return notificationService.subscribe(userPrincipal.getId());
    }

    // 내 모든 알림 목록 조회 API
    @GetMapping("/api/v1/notifications")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(notificationService.getMyNotifications(userPrincipal));
    }

    // 읽지 않은 알림 개수 조회 API
    @GetMapping("/api/v1/notifications/count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(notificationService.getUnreadCount(userPrincipal));
    }

    // 특정 알림 읽음 처리 API
    @PostMapping("/api/v1/notifications/{notificationId}/read")
    public ResponseEntity<Void> readNotification(@PathVariable Long notificationId, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        notificationService.readNotification(notificationId, userPrincipal);
        return ResponseEntity.ok().build();
    }
}
