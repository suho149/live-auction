package com.suho149.liveauction.domain.chat.service;

import com.suho149.liveauction.domain.chat.dto.ChatMessageResponse;
import com.suho149.liveauction.domain.chat.dto.ChatRoomResponse;
import com.suho149.liveauction.domain.chat.entity.ChatMessage;
import com.suho149.liveauction.domain.chat.entity.ChatRoom;
import com.suho149.liveauction.domain.chat.repository.ChatMessageRepository;
import com.suho149.liveauction.domain.chat.repository.ChatRoomRepository;
import com.suho149.liveauction.domain.notification.entity.NotificationType;
import com.suho149.liveauction.domain.notification.service.NotificationService;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SimpMessageSendingOperations messagingTemplate;
    private final NotificationService notificationService;

    @Transactional
    public ChatRoom findOrCreateChatRoom(Long productId, UserPrincipal userPrincipal) {
        Product product = productRepository.findById(productId).orElseThrow();
        User buyer = userRepository.getReferenceById(userPrincipal.getId());

        // 판매자 본인과는 채팅방을 만들 수 없음
        if (product.getSeller().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("자기 자신과는 채팅할 수 없습니다.");
        }

        return chatRoomRepository.findByProductIdAndBuyerId(productId, buyer.getId())
                .orElseGet(() -> chatRoomRepository.save(ChatRoom.builder().product(product).buyer(buyer).build()));
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getChatMessages(Long roomId) {
        return chatMessageRepository.findByChatRoomIdOrderBySentAtAsc(roomId)
                .stream().map(ChatMessageResponse::from).collect(Collectors.toList());
    }

    @Transactional
    public void saveAndSendMessage(Long roomId, String messageContent, String senderEmail) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        ChatMessage chatMessage = ChatMessage.builder()
                .chatRoom(chatRoom)
                .sender(sender)
                .message(messageContent)
                .build();

        chatMessageRepository.save(chatMessage);

        // 상대방에게 알림 발송
        User recipient = chatRoom.getProduct().getSeller().getId().equals(sender.getId())
                ? chatRoom.getBuyer()
                : chatRoom.getProduct().getSeller();

        String content = sender.getName() + "님으로부터 새 메시지가 도착했습니다.";
        String url = "/chat/rooms/" + roomId;
        notificationService.send(recipient, NotificationType.CHAT, content, url);

        messagingTemplate.convertAndSend("/sub/chat/rooms/" + roomId, ChatMessageResponse.from(chatMessage));
    }

    public List<ChatRoomResponse> getMyChatRooms(UserPrincipal userPrincipal) {
        Long userId = userPrincipal.getId();
        List<ChatRoom> chatRooms = chatRoomRepository.findByUserIdWithDetails(userId);

        return chatRooms.stream()
                .map(chatRoom -> ChatRoomResponse.from(chatRoom, userId))
                .collect(Collectors.toList());
    }
}
