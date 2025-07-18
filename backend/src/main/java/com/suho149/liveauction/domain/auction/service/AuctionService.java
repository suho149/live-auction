package com.suho149.liveauction.domain.auction.service;

import com.suho149.liveauction.domain.auction.dto.BidRequest;
import com.suho149.liveauction.domain.auction.dto.BidResponse;
import com.suho149.liveauction.domain.notification.entity.NotificationType;
import com.suho149.liveauction.domain.notification.service.NotificationService;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuctionService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SimpMessageSendingOperations messagingTemplate;
    private final NotificationService notificationService;

    @Transactional
    public void placeBid(Long productId, BidRequest bidRequest, String email) {
        User bidder = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("유저를 찾을 수 없습니다: " + email));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        // 유효성 검사
        if (bidRequest.getBidAmount() <= product.getCurrentPrice()) {
            throw new IllegalArgumentException("현재 가격보다 높은 금액으로 입찰해야 합니다.");
        }
        if (LocalDateTime.now().isAfter(product.getAuctionEndTime())) {
            throw new IllegalArgumentException("경매가 종료된 상품입니다.");
        }

        // 입찰 정보 업데이트
        product.updateBid(bidder, bidRequest.getBidAmount());

        // 입찰 결과를 구독자들에게 전송
        BidResponse bidResponse = BidResponse.builder()
                .productId(productId)
                .newPrice(product.getCurrentPrice())
                .bidderName(bidder.getName())
                .build();

        User previousHighestBidder = product.getHighestBidder(); // 이전 최고 입찰자 저장

        product.updateBid(bidder, bidRequest.getBidAmount()); // 입찰 정보 업데이트

        // ★ 이전 최고 입찰자가 있었고, 현재 입찰자와 다른 경우에만 알림 발송
        if (previousHighestBidder != null && !previousHighestBidder.getId().equals(bidder.getId())) {
            String content = "'" + product.getName() + "' 상품에 더 높은 가격의 입찰이 등록되었습니다.";
            String url = "/products/" + productId;
            notificationService.send(previousHighestBidder, NotificationType.BID, content, url);
        }

        messagingTemplate.convertAndSend("/sub/products/" + productId, bidResponse);
    }
}
