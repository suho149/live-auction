package com.suho149.liveauction.domain.chat.dto;

import com.suho149.liveauction.domain.chat.entity.ChatMessage;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatMessageResponse {
    private Long messageId;
    private Long senderId;
    private String senderName;
    private String message;
    private LocalDateTime sentAt;

    public static ChatMessageResponse from(ChatMessage chatMessage) {
        return ChatMessageResponse.builder()
                .messageId(chatMessage.getId())
                .senderId(chatMessage.getSender().getId())
                .senderName(chatMessage.getSender().getName())
                .message(chatMessage.getMessage())
                .sentAt(chatMessage.getSentAt())
                .build();
    }
}
