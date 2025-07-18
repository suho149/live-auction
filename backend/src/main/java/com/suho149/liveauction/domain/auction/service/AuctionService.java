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

import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.Locale;

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

        // 판매자 본인 입찰 방지 로직 추가
        if (product.getSeller().getId().equals(bidder.getId())) {
            throw new IllegalStateException("자신이 등록한 상품에는 입찰할 수 없습니다.");
        }

        // 유효성 검사
        if (bidRequest.getBidAmount() <= product.getCurrentPrice()) {
            throw new IllegalArgumentException("현재 가격보다 높은 금액으로 입찰해야 합니다.");
        }
        if (LocalDateTime.now().isAfter(product.getAuctionEndTime())) {
            throw new IllegalArgumentException("경매가 종료된 상품입니다.");
        }

        // 입찰 정보 업데이트 전에 이전 최고 입찰자를 저장
        User previousHighestBidder = product.getHighestBidder();

        // 입찰 정보 업데이트
        product.updateBid(bidder, bidRequest.getBidAmount());

        // 입찰 결과를 구독자들에게 실시간 전송
        BidResponse bidResponse = BidResponse.builder()
                .productId(productId)
                .newPrice(product.getCurrentPrice())
                .bidderName(bidder.getName())
                .build();
        messagingTemplate.convertAndSend("/sub/products/" + productId, bidResponse);

        // 알림 발송 로직
        String url = "/products/" + productId;
        String formattedAmount = NumberFormat.getInstance(Locale.KOREA).format(bidRequest.getBidAmount());

        // 1. 판매자에게 알림 (입찰자가 판매자 본인이 아닐 경우)
        if (!product.getSeller().getId().equals(bidder.getId())) {
            String sellerContent = "'" + product.getName() + "' 상품에 " + formattedAmount + "원의 새로운 입찰이 등록되었습니다.";
            notificationService.send(product.getSeller(), NotificationType.BID, sellerContent, url);
        }

        // 2. 이전 최고 입찰자에게 알림 (이전 입찰자가 있었고, 현재 입찰자와 다를 경우)
        if (previousHighestBidder != null && !previousHighestBidder.getId().equals(bidder.getId())) {
            String content = "'" + product.getName() + "' 상품에 더 높은 가격의 입찰이 등록되었습니다.";
            notificationService.send(previousHighestBidder, NotificationType.BID, content, url);
        }
    }
}
