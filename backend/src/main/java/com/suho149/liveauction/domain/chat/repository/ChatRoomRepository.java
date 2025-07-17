package com.suho149.liveauction.domain.chat.repository;

import com.suho149.liveauction.domain.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByProductIdAndBuyerId(Long productId, Long buyerId);
}
