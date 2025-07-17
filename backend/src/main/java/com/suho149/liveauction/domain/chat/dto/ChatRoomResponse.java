package com.suho149.liveauction.domain.chat.dto;

import com.suho149.liveauction.domain.chat.entity.ChatRoom;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatRoomResponse {
    private Long roomId;
    private String productName;
    private String opponentName; // 채팅 상대방 이름
    // private String lastMessage; // 마지막 메시지 (심화 기능)
    // private LocalDateTime lastMessageTime; // 마지막 메시지 시간 (심화 기능)

    public static ChatRoomResponse from(ChatRoom chatRoom, Long currentUserId) {
        // 현재 사용자를 기준으로 상대방 정보를 설정
        String opponentName;
        if (chatRoom.getBuyer().getId().equals(currentUserId)) {
            // 내가 구매 희망자이면, 상대방은 판매자
            opponentName = chatRoom.getProduct().getSeller().getName();
        } else {
            // 내가 판매자이면, 상대방은 구매 희망자
            opponentName = chatRoom.getBuyer().getName();
        }

        return ChatRoomResponse.builder()
                .roomId(chatRoom.getId())
                .productName(chatRoom.getProduct().getName())
                .opponentName(opponentName)
                .build();
    }
}
