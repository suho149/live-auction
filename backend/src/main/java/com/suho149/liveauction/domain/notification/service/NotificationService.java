package com.suho149.liveauction.domain.notification.service;

import com.suho149.liveauction.domain.notification.dto.NotificationResponse;
import com.suho149.liveauction.domain.notification.entity.Notification;
import com.suho149.liveauction.domain.notification.entity.NotificationType;
import com.suho149.liveauction.domain.notification.repository.NotificationRepository;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.keyword.repository.KeywordRepository;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {
    // 스레드 안전한 자료구조를 사용하여 사용자 ID와 SseEmitter를 매핑
    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final KeywordRepository keywordRepository;
    private final NotificationRepository notificationRepository;

    // 1. SSE 연결
    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE); // 타임아웃을 매우 길게 설정
        emitters.put(userId, emitter);

        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));

        // 연결 성공을 알리는 더미 데이터 전송
        sendToClient(userId, "connected", "SSE 연결이 성공적으로 완료되었습니다.");

        return emitter;
    }

    // 알림 생성 및 발송을 위한 통합 메소드
    @Transactional
    public void send(User user, NotificationType type, String content, String url) {
        if (type == NotificationType.CHAT) {
            Optional<Notification> existingOpt = notificationRepository.findFirstByUserAndUrlAndIsReadFalse(user, url);

            if (existingOpt.isPresent()) {
                Notification existing = existingOpt.get();
                existing.updateForChatNotification(); // 엔티티의 업데이트 메소드 호출
                sendToClient(user.getId(), "notificationUpdate", new NotificationResponse(existing));
                return;
            }
        }

        Notification notification = Notification.builder().user(user).type(type).content(content).url(url).build();
        notificationRepository.save(notification);
        sendToClient(user.getId(), "notification", new NotificationResponse(notification));
    }

    // 특정 사용자에게 이벤트 전송
    private void sendToClient(Long userId, String eventName, Object data) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .id(String.valueOf(userId)) // 이벤트 ID
                        .name(eventName) // 이벤트 이름
                        .data(data)); // 실제 데이터
            } catch (IOException e) {
                emitters.remove(userId);
                log.error("SSE 전송 오류 발생: userId={}", userId, e);
            }
        }
    }

    // 내 모든 알림 목록 조회 메소드 구현
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(UserPrincipal userPrincipal) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userPrincipal.getId());
        return notifications.stream()
                .map(NotificationResponse::new)
                .collect(Collectors.toList());
    }

    // 읽지 않은 알림 개수 조회 메소드 구현
    @Transactional(readOnly = true)
    public Long getUnreadCount(UserPrincipal userPrincipal) {
        return notificationRepository.countByUserIdAndIsReadFalse(userPrincipal.getId());
    }

    // 특정 알림 읽음 처리 메소드 구현
    @Transactional
    public void readNotification(Long notificationId, UserPrincipal userPrincipal) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 알림입니다."));

        // 본인의 알림인지 확인
        if (!notification.getUser().getId().equals(userPrincipal.getId())) {
            throw new IllegalStateException("해당 알림을 읽을 권한이 없습니다.");
        }

        notification.read(); // isRead를 true로 변경
    }

    // '모두 읽음' 처리 메소드 추가
    @Transactional
    public void readAllNotifications(UserPrincipal userPrincipal) {
        // 1. 현재 사용자의 모든 읽지 않은 알림을 가져옴
        List<Notification> unreadNotifications = notificationRepository.findAllByUserIdAndIsReadFalse(userPrincipal.getId());

        // 2. 각 알림의 isRead 상태를 true로 변경
        unreadNotifications.forEach(Notification::read);

        // 3. 변경된 상태를 DB에 저장
        // @Transactional 어노테이션 덕분에, 메소드가 끝나면 변경된 내용(Dirty Checking)이 자동으로 DB에 반영됩니다.
        // 명시적으로 saveAll을 호출할 필요가 없습니다.
    }
}
