package com.suho149.liveauction.domain.chat.dto;

import com.suho149.liveauction.domain.chat.entity.ChatMessage;
import com.suho149.liveauction.domain.chat.entity.ChatRoom;
import com.suho149.liveauction.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatRoomResponse {
    private Long roomId;
    private String productName;
    private String opponentName; // 채팅 상대방 이름
    private String opponentPicture; // 상대방 프로필 사진
    private String lastMessage; // 마지막 메시지
    private LocalDateTime lastMessageTime; // 마지막 메시지 시간

    public static ChatRoomResponse from(ChatRoom chatRoom, Long currentUserId) {
        User opponent;
        if (chatRoom.getBuyer().getId().equals(currentUserId)) {
            opponent = chatRoom.getProduct().getSeller();
        } else {
            opponent = chatRoom.getBuyer();
        }

        // 마지막 메시지 정보 추출
        ChatMessage lastMsg = chatRoom.getMessages().isEmpty() ? null : chatRoom.getMessages().get(chatRoom.getMessages().size() - 1);

        return ChatRoomResponse.builder()
                .roomId(chatRoom.getId())
                .productName(chatRoom.getProduct().getName())
                .opponentName(opponent.getName())
                .opponentPicture(opponent.getPicture()) // 상대방 프로필 사진 추가
                .lastMessage(lastMsg != null ? lastMsg.getMessage() : "대화를 시작해보세요.")
                .lastMessageTime(lastMsg != null ? lastMsg.getSentAt() : null)
                .build();
    }
}
