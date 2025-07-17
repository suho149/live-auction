package com.suho149.liveauction.domain.chat.controller;

import com.suho149.liveauction.domain.chat.dto.ChatMessageRequest;
import com.suho149.liveauction.domain.chat.dto.ChatMessageResponse;
import com.suho149.liveauction.domain.chat.entity.ChatRoom;
import com.suho149.liveauction.domain.chat.service.ChatService;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/v1/chat")
public class ChatController {
    private final ChatService chatService;

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
            ChatMessageRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        chatService.saveAndSendMessage(roomId, request.getMessage(), userPrincipal);
    }
}
