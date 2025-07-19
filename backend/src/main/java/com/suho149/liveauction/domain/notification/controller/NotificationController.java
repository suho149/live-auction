package com.suho149.liveauction.domain.notification.controller;

import com.suho149.liveauction.domain.notification.dto.NotificationResponse;
import com.suho149.liveauction.domain.notification.service.NotificationService;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class NotificationController {

    private final NotificationService notificationService;

    // SSE 구독 엔드포인트
    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) return null;
        return notificationService.subscribe(userPrincipal.getId());
    }

    // 내 모든 알림 목록 조회 API
    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(notificationService.getMyNotifications(userPrincipal));
    }

    // 읽지 않은 알림 개수 조회 API
    @GetMapping("/notifications/count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(notificationService.getUnreadCount(userPrincipal));
    }

    // 특정 알림 읽음 처리 API
    @PostMapping("/notifications/{notificationId}/read")
    public ResponseEntity<Void> readNotification(@PathVariable Long notificationId, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        notificationService.readNotification(notificationId, userPrincipal);
        return ResponseEntity.ok().build();
    }

    //'모두 읽음' API 엔드포인트 추가
    @PostMapping("/notifications/read-all")
    public ResponseEntity<Void> readAllNotifications(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        notificationService.readAllNotifications(userPrincipal);
        return ResponseEntity.ok().build();
    }
}
