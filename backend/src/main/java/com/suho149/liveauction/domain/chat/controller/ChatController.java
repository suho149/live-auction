package com.suho149.liveauction.domain.chat.controller;

import com.suho149.liveauction.domain.chat.dto.ChatMessageRequest;
import com.suho149.liveauction.domain.chat.dto.ChatMessageResponse;
import com.suho149.liveauction.domain.chat.dto.ChatRoomResponse;
import com.suho149.liveauction.domain.chat.entity.ChatRoom;
import com.suho149.liveauction.domain.chat.service.ChatService;
import com.suho149.liveauction.global.jwt.JwtTokenProvider;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Slf4j
@Controller
@RequiredArgsConstructor
@RequestMapping("/api/v1/chat")
public class ChatController {
    private final ChatService chatService;
    private final JwtTokenProvider jwtTokenProvider;

    // 채팅방 생성 또는 조회 (HTTP)
    @PostMapping("/rooms/{productId}")
    public ResponseEntity<Long> findOrCreateChatRoom(@PathVariable Long productId, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        ChatRoom chatRoom = chatService.findOrCreateChatRoom(productId, userPrincipal);
        return ResponseEntity.ok(chatRoom.getId());
    }

    // 특정 채팅방의 메시지 목록 조회 (HTTP)
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getChatMessages(@PathVariable Long roomId) {
        return ResponseEntity.ok(chatService.getChatMessages(roomId));
    }

    // 메시지 발행 (WebSocket)
    @MessageMapping("/rooms/{roomId}/message")
    public void sendMessage(
            @DestinationVariable Long roomId,
            @Payload ChatMessageRequest request,
            @Header("Authorization") final String token // ★ 헤더에서 Authorization 값을 직접 받음
    ) {
        log.info("Received message for room {}: {}", roomId, request.getMessage());

        // 토큰 유효성 검사
        if (!StringUtils.hasText(token) || !token.startsWith("Bearer ")) {
            log.error("Invalid or missing token for room {}", roomId);
            return;
        }

        String jwt = token.substring(7);
        if (!jwtTokenProvider.validateToken(jwt)) {
            log.error("Token validation failed for room {}", roomId);
            return;
        }

        // 토큰에서 이메일 추출 후 서비스 호출
        String email = jwtTokenProvider.getEmailFromToken(jwt);
        chatService.saveAndSendMessage(roomId, request.getMessage(), email);
    }

    // 내 채팅방 목록 조회
    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomResponse>> getMyChatRooms(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(chatService.getMyChatRooms(userPrincipal));
    }
}
