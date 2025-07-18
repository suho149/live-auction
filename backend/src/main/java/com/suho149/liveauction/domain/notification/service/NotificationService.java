package com.suho149.liveauction.domain.notification.service;

import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.keyword.repository.KeywordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {
    // 스레드 안전한 자료구조를 사용하여 사용자 ID와 SseEmitter를 매핑
    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final KeywordRepository keywordRepository;

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

    // 2. 새로운 상품이 등록되었을 때 알림 발송
    public void notifyNewProduct(Product product) {
        String productInfo = product.getName() + " " + product.getDescription();
        List<User> usersToNotify = keywordRepository.findUsersByKeywordIn(productInfo);

        usersToNotify.forEach(user ->
                sendToClient(user.getId(), "newProduct",
                        "'" + product.getName() + "' 상품이 등록되었습니다!")
        );
    }

    // 3. 특정 사용자에게 이벤트 전송
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
}
