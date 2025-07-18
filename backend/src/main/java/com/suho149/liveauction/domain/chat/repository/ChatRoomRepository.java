package com.suho149.liveauction.domain.chat.repository;

import com.suho149.liveauction.domain.chat.entity.ChatRoom;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByProductIdAndBuyerId(Long productId, Long buyerId);

    // 사용자가 판매자 또는 구매자로 참여한 모든 채팅방 목록 조회
    @Query("SELECT cr FROM ChatRoom cr " +
            "JOIN FETCH cr.product p " +
            "JOIN FETCH p.seller " +
            "JOIN FETCH cr.buyer " +
            "WHERE p.seller.id = :userId OR cr.buyer.id = :userId")
    List<ChatRoom> findByUserId(@Param("userId") Long userId);

    // Fetch Join을 사용하여 연관된 모든 엔티티를 한번에 가져오도록 수정
    @Query("SELECT cr FROM ChatRoom cr " +
            "LEFT JOIN FETCH cr.messages " + // 마지막 메시지를 위해 messages를 가져와야 함
            "JOIN FETCH cr.product p " +
            "JOIN FETCH p.seller " +
            "JOIN FETCH cr.buyer " +
            "WHERE p.seller.id = :userId OR cr.buyer.id = :userId")
    List<ChatRoom> findByUserIdWithDetails(@Param("userId") Long userId);
}
