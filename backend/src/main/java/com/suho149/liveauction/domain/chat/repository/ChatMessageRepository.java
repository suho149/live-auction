package com.suho149.liveauction.domain.chat.repository;

import com.suho149.liveauction.domain.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * 특정 채팅방 ID(chatRoomId)에 해당하는 모든 메시지를 찾아서,
     * 보낸 시간(sentAt)을 기준으로 오름차순(ASC)으로 정렬하여 반환합니다.
     * Spring Data JPA의 쿼리 메소드 기능을 사용하여 메소드 이름만으로 쿼리를 자동 생성합니다.
     *
     * @param chatRoomId 조회할 채팅방의 ID
     * @return 해당 채팅방의 모든 메시지 목록 (시간순 정렬)
     */
    List<ChatMessage> findByChatRoomIdOrderBySentAtAsc(Long chatRoomId);
}
