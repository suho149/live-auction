package com.suho149.liveauction.domain.auction.service;

import com.suho149.liveauction.domain.auction.dto.AutoBidRequest;
import com.suho149.liveauction.domain.auction.dto.BidRequest;
import com.suho149.liveauction.domain.auction.dto.BidResponse;
import com.suho149.liveauction.domain.auction.dto.BuyNowRequest;
import com.suho149.liveauction.domain.auction.entity.AutoBid;
import com.suho149.liveauction.domain.auction.repository.AutoBidRepository;
import com.suho149.liveauction.domain.notification.entity.NotificationType;
import com.suho149.liveauction.domain.notification.service.NotificationService;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.entity.ProductStatus;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.NumberFormat;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuctionService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SimpMessageSendingOperations messagingTemplate;
    private final NotificationService notificationService;
    private final AutoBidRepository autoBidRepository;

    private static final long EXTENSION_THRESHOLD_SECONDS = 60; // 60초(1분) 이내 입찰 시 연장
    private static final long EXTENSION_DURATION_SECONDS = 60;  // 60초(1분) 연장

    @Transactional
    public void placeBid(Long productId, BidRequest bidRequest, String email) {
        User bidder = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("유저를 찾을 수 없습니다: " + email));

        // 일반 조회 대신, 비관적 락을 사용하는 조회 메소드로 변경
        Product product = productRepository.findByIdWithPessimisticLock(productId)
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

        // 경매 연장 로직 시작
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime currentEndTime = product.getAuctionEndTime();

        // 1. 마감 시간까지 남은 시간 계산
        long secondsUntilEnd = Duration.between(now, currentEndTime).getSeconds();

        // 2. 남은 시간이 임계값(60초) 이하이고, 아직 경매가 끝나지 않았을 경우
        if (secondsUntilEnd > 0 && secondsUntilEnd <= EXTENSION_THRESHOLD_SECONDS) {
            // 3. 마감 시간을 '현재 시간'으로부터 60초 뒤로 연장
            LocalDateTime newEndTime = now.plusSeconds(EXTENSION_DURATION_SECONDS);
            product.extendAuctionEndTime(newEndTime);
            log.info("상품 ID {} 경매 시간 연장. 새 마감 시간: {}", productId, newEndTime);
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
                .auctionEndTime(product.getAuctionEndTime()) // 연장된 마감 시간 전달
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

        // 일반 입찰 후에도 자동 입찰 경쟁을 유발
        processAutoBids(product);
    }

    @Transactional
    public void buyNow(Long productId, BuyNowRequest request, String email) {
        // 사용자 조회
        User buyer = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 상품 조회 (비관적 락 사용)
        Product product = productRepository.findByIdWithPessimisticLock(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. ID: " + productId));

        // 1. 유효성 검사
        if (product.getBuyNowPrice() == null) {
            throw new IllegalStateException("즉시 구매가 불가능한 상품입니다.");
        }
        if (!product.getBuyNowPrice().equals(request.getBuyNowPrice())) {
            throw new IllegalStateException("즉시 구매 가격이 일치하지 않습니다.");
        }
        if (product.getStatus() != ProductStatus.ON_SALE) {
            throw new IllegalStateException("현재 판매 중인 상품이 아닙니다.");
        }
        if (product.getSeller().getId().equals(buyer.getId())) {
            throw new IllegalStateException("자신이 등록한 상품은 구매할 수 없습니다.");
        }

        // 2. 즉시 구매 처리
        product.updateBid(buyer, product.getBuyNowPrice()); // 구매자를 최고 입찰자로, 현재가를 즉시 구매가로 설정
        product.endAuctionWithWinner(); // 경매 종료 (결제 대기) 상태로 변경

        // 3. 실시간 알림 전송 (가격, 상태 변경)
        BidResponse bidResponse = BidResponse.builder()
                .productId(productId)
                .newPrice(product.getCurrentPrice())
                .bidderName(buyer.getName())
                .auctionEndTime(product.getAuctionEndTime())
                .build();
        messagingTemplate.convertAndSend("/sub/products/" + productId, bidResponse);

        // 4. 낙찰자에게 알림 발송
        String content = "'" + product.getName() + "' 상품을 즉시 구매하여 최종 낙찰되었습니다! 24시간 내에 결제를 완료해주세요.";
        notificationService.send(buyer, NotificationType.BID, content, "/products/" + product.getId());
        log.info("상품 ID {} 즉시 구매 처리 완료. 구매자: {}", productId, buyer.getName());
    }

    @Transactional
    public void setupAutoBid(Long productId, AutoBidRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("자동 입찰 설정 실패: 사용자를 찾을 수 없습니다. email: " + email));

        // 여기서는 데이터 수정이 아닌 조회이므로 락이 필요 없습니다.
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("자동 입찰 설정 실패: 상품을 찾을 수 없습니다. ID: " + productId));

        if (request.getMaxAmount() <= product.getCurrentPrice()) {
            throw new IllegalArgumentException("자동 입찰 금액은 현재가보다 높아야 합니다.");
        }

        // 기존에 설정한 자동 입찰이 있는지 확인
        autoBidRepository.findByUser_IdAndProduct_Id(user.getId(), productId)
                .ifPresentOrElse(
                        autoBid -> autoBid.updateMaxAmount(request.getMaxAmount()), // 있으면 금액만 업데이트
                        () -> { // 없으면 새로 생성
                            AutoBid newAutoBid = AutoBid.builder()
                                    .user(user)
                                    .product(product)
                                    .maxAmount(request.getMaxAmount())
                                    .build();
                            autoBidRepository.save(newAutoBid);
                        }
                );

        // 자동 입찰 설정 후, 즉시 자동 입찰 로직을 한 번 실행해볼 수 있음
        processAutoBids(product);
    }

    private void processAutoBids(Product product) {
        log.info("상품 ID {} 자동 입찰 프로세스 시작... 현재가: {}, 최고 입찰자: {}",
                product.getId(), product.getCurrentPrice(), product.getHighestBidder() != null ? product.getHighestBidder().getName() : "없음");

        long minBidIncrement = 1000;

        // 1. 이 상품에 대한 모든 자동 입찰 설정을 최대 금액 순으로 가져옴
        List<AutoBid> autoBids = autoBidRepository.findByProduct_IdOrderByMaxAmountDesc(product.getId());

        // --- ★★★ 로직 수정 시작 ★★★ ---

        // 2. 자동 입찰 설정이 아예 없으면 즉시 종료
        if (autoBids.isEmpty()) {
            log.info("자동 입찰 설정 없음. 종료.");
            return;
        }

        // 3. 최고 자동 입찰 설정자 추출
        AutoBid topAutoBidderSetting = autoBids.get(0);
        User topAutoBidder = topAutoBidderSetting.getUser();
        long topMaxAmount = topAutoBidderSetting.getMaxAmount();

        // 4. 현재 최고 입찰자가 최고 자동 입찰 설정자와 동일한 경우, 아무것도 할 필요 없음
        if (product.getHighestBidder() != null && product.getHighestBidder().getId().equals(topAutoBidder.getId())) {
            log.info("현재 최고 입찰자가 이미 최고 자동 입찰자임. 종료.");
            return;
        }

        // 5. 자동 입찰자가 입찰해야 할 금액 계산
        //    - 경쟁자가 있으면 (자동 입찰 2순위 또는 현재 최고 입찰자)
        //    - 경쟁자가 없으면 (현재가 + 최소입찰단위)
        long nextBidAmount;

        // 5-1. 자동 입찰 경쟁자가 있는지 확인 (2순위 자동 입찰자)
        if (autoBids.size() > 1) {
            AutoBid secondAutoBidderSetting = autoBids.get(1);
            long secondMaxAmount = secondAutoBidderSetting.getMaxAmount();
            // 2순위의 최대 입찰가보다 높게 입찰해야 함
            nextBidAmount = Math.min(topMaxAmount, secondMaxAmount + minBidIncrement);
        } else {
            // 5-2. 자동 입찰 경쟁자는 없지만, 일반 입찰자가 있는 경우
            // 현재가보다 높게 입찰해야 함
            nextBidAmount = Math.min(topMaxAmount, product.getCurrentPrice() + minBidIncrement);
        }

        // 6. 계산된 입찰가가 현재가보다 낮은 경우는 이미 다른 사람이 더 높게 입찰한 것이므로 종료
        if (nextBidAmount <= product.getCurrentPrice()) {
            log.info("계산된 자동 입찰가({})가 현재가({})보다 낮거나 같음. 종료.", nextBidAmount, product.getCurrentPrice());
            return;
        }

        // 7. 최고 자동 입찰 설정자가 입찰 실행
        log.info("자동 입찰 실행: {}가 {}원에 입찰.", topAutoBidder.getName(), nextBidAmount);
        updateAndNotifyBid(product, topAutoBidder, nextBidAmount);

        // 8. (선택적) 한 번의 상호작용 후 다시 processAutoBids를 호출하여 연쇄 반응 처리
        // 하지만 현재 로직에서는 한 번의 placeBid에 한 번의 자동 입찰 반응으로 충분함.
        // processAutoBids(product); // 재귀 호출은 복잡성을 높일 수 있어 일단 보류
    }

    private void updateAndNotifyBid(Product product, User bidder, long amount) {
        User previousBidder = product.getHighestBidder();
        product.updateBid(bidder, amount);

        BidResponse response = BidResponse.builder()
                .productId(product.getId())
                .newPrice(amount)
                .bidderName(bidder.getName())
                .auctionEndTime(product.getAuctionEndTime())
                .build();
        messagingTemplate.convertAndSend("/sub/products/" + product.getId(), response);

        // 알림 전송 로직
        String url = "/products/" + product.getId();
        // 숫자를 1,000 단위 콤마가 있는 문자열로 포맷팅
        String formattedAmount = NumberFormat.getInstance(Locale.KOREA).format(amount);

        // 1. 이전 최고 입찰자에게 알림 (이전 입찰자가 있었고, 현재 입찰자와 다를 경우)
        if (previousBidder != null && !previousBidder.getId().equals(bidder.getId())) {
            String content = "'" + product.getName() + "' 상품에 더 높은 가격(" + formattedAmount + "원)의 입찰이 등록되었습니다.";
            notificationService.send(previousBidder, NotificationType.BID, content, url);
        }

        // 2. 판매자에게 알림 (입찰자가 판매자 본인이 아닐 경우)
        if (!product.getSeller().getId().equals(bidder.getId())) {
            String sellerContent = "'" + product.getName() + "' 상품에 " + formattedAmount + "원의 새로운 입찰이 등록되었습니다.";
            notificationService.send(product.getSeller(), NotificationType.BID, sellerContent, url);
        }
    }
}
