package com.suho149.liveauction.domain.auction.service;

import com.suho149.liveauction.domain.auction.dto.AutoBidRequest;
import com.suho149.liveauction.domain.auction.dto.BidRequest;
import com.suho149.liveauction.domain.auction.dto.BidResponse;
import com.suho149.liveauction.domain.auction.dto.BuyNowRequest;
import com.suho149.liveauction.domain.auction.entity.AutoBid;
import com.suho149.liveauction.domain.auction.entity.Bid;
import com.suho149.liveauction.domain.auction.repository.AutoBidRepository;
import com.suho149.liveauction.domain.auction.repository.BidRepository;
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
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuctionService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SimpMessageSendingOperations messagingTemplate;
    private final NotificationService notificationService;
    private final AutoBidRepository autoBidRepository;
    private final BidRepository bidRepository;

    private static final long EXTENSION_THRESHOLD_SECONDS = 60; // 60초(1분) 이내 입찰 시 연장
    private static final long EXTENSION_DURATION_SECONDS = 60;  // 60초(1분) 연장

    @Transactional
    public void placeBid(Long productId, BidRequest bidRequest, String email) {
        User bidder = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("유저를 찾을 수 없습니다: " + email));

        // 일반 조회 대신, 비관적 락을 사용하는 조회 메소드로 변경
        Product product = productRepository.findByIdWithPessimisticLock(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        long bidAmount = bidRequest.getBidAmount();

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

        updateAndNotifyBid(product, bidder, bidAmount);

        // 일반 입찰에 대한 알림을 여기서 직접 보냄
        sendBidNotifications(product, bidder, previousHighestBidder, bidAmount);

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
        log.info("상품 ID {} 자동 입찰 프로세스 시작...", product.getId());
        long minBidIncrement = 1000;

        while (true) {
            // 1. 자동 입찰 목록 조회
            List<AutoBid> autoBids = autoBidRepository.findByProduct_IdOrderByMaxAmountDesc(product.getId());
            User currentHighestBidder = product.getHighestBidder();
            long currentPrice = product.getCurrentPrice();

            // 2. [종료 조건 1] 자동 입찰자가 없으면 할 일 없음
            if (autoBids.isEmpty()) {
                log.info("자동 입찰 설정 없음. 종료.");
                break;
            }

            // 3. 최고 자동 입찰자(A) 정보
            AutoBid topAutoBidderSetting = autoBids.get(0);
            User topAutoBidder = topAutoBidderSetting.getUser();
            long topMaxAmount = topAutoBidderSetting.getMaxAmount();

            // 4. [종료 조건 2] 최고 자동 입찰자의 한도가 현재가보다 낮으면 더 이상 입찰 불가
            if (topMaxAmount <= currentPrice) {
                log.info("최고 자동 입찰자({})의 한도({})가 현재가({})보다 낮거나 같음. 종료.",
                        topAutoBidder.getName(), topMaxAmount, currentPrice);
                break;
            }

            // 5. [종료 조건 3] 최고 자동 입찰자가 이미 최고 입찰자이고, 2순위 경쟁자가 없는 경우
            if (currentHighestBidder != null && currentHighestBidder.getId().equals(topAutoBidder.getId())) {
                // 2순위 자동 입찰자가 없거나, 2순위의 한도가 이미 현재가보다 낮으면 경쟁 끝
                if (autoBids.size() < 2 || autoBids.get(1).getMaxAmount() <= currentPrice) {
                    log.info("최고 자동 입찰자가 이미 선두이며 추가 경쟁자 없음. 종료.");
                    break;
                }
            }

            // --- 입찰 실행 ---
            long nextBidAmount;
            User nextHighestBidder;

            // 6. 현재 최고 입찰자가 없는 경우 (경매 시작 후 첫 입찰)
            if (currentHighestBidder == null) {
                nextHighestBidder = topAutoBidder;
                nextBidAmount = Math.min(topMaxAmount, product.getStartPrice() + minBidIncrement);
            } else {
                // 7. 2순위 경쟁자(B)가 있는 경우
                if (autoBids.size() > 1) {
                    AutoBid secondAutoBidderSetting = autoBids.get(1);
                    // 최고 입찰자가 1순위(A)냐 2순위(B)냐 아니면 제3자(C)냐에 따라 경쟁 구도가 달라짐
                    if(currentHighestBidder.getId().equals(topAutoBidder.getId())) {
                        // 현재 A가 1등. B의 한계까지 가격을 올려야 함.
                        nextHighestBidder = topAutoBidder;
                        nextBidAmount = Math.min(topMaxAmount, secondAutoBidderSetting.getMaxAmount() + minBidIncrement);
                    } else {
                        // B 또는 C가 1등. A가 이들을 이기기 위해 입찰.
                        nextHighestBidder = topAutoBidder;
                        nextBidAmount = Math.min(topMaxAmount, currentPrice + minBidIncrement);
                    }
                } else { // 2순위 경쟁자가 없는 경우 (일반 입찰자 vs 1순위 자동 입찰자)
                    nextHighestBidder = topAutoBidder;
                    nextBidAmount = Math.min(topMaxAmount, currentPrice + minBidIncrement);
                }
            }

            // 8. [무한루프 방지] 계산된 입찰액이 현재가 이하면 종료
            if (nextBidAmount <= currentPrice) {
                log.info("계산된 다음 입찰가({})가 현재가({})보다 낮거나 같아 종료.", nextBidAmount, currentPrice);
                break;
            }

            // 9. 입찰 실행 및 알림
            User previousBidder = product.getHighestBidder();
            updateAndNotifyBid(product, nextHighestBidder, nextBidAmount);
            sendBidNotifications(product, nextHighestBidder, previousBidder, nextBidAmount);
        }
    }

    private void updateAndNotifyBid(Product product, User bidder, long amount) {
        product.updateBid(bidder, amount);

        // 입찰 기록 저장
        Bid newBid = Bid.builder()
                .product(product)
                .bidder(bidder)
                .amount(amount)
                .build();
        bidRepository.save(newBid);

        BidResponse response = BidResponse.builder()
                .productId(product.getId())
                .newPrice(amount)
                .bidderName(bidder.getName())
                .auctionEndTime(product.getAuctionEndTime())
                .build();
        messagingTemplate.convertAndSend("/sub/products/" + product.getId(), response);
    }

    // 알림 발송 로직을 별도 메소드로 분리
    private void sendBidNotifications(Product product, User newBidder, User previousBidder, long amount) {
        String url = "/products/" + product.getId();
        String formattedAmount = NumberFormat.getInstance(Locale.KOREA).format(amount);

        // 이전 최고 입찰자에게 알림
        if (previousBidder != null && !previousBidder.getId().equals(newBidder.getId())) {
            String content = "'" + product.getName() + "' 상품에 더 높은 가격(" + formattedAmount + "원)의 입찰이 등록되었습니다.";
            notificationService.send(previousBidder, NotificationType.BID, content, url);
        }
        // 판매자에게 알림
        if (!product.getSeller().getId().equals(newBidder.getId())) {
            String sellerContent = "'" + product.getName() + "' 상품에 " + formattedAmount + "원의 새로운 입찰이 등록되었습니다.";
            notificationService.send(product.getSeller(), NotificationType.BID, sellerContent, url);
        }
    }

    @Transactional
    public void cancelAutoBid(Long productId, String email) {
        // --- 1. 사용자 조회 ---
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("자동 입찰 취소 실패: 사용자를 찾을 수 없습니다. email: " + email));

        // --- 2. 자동 입찰 설정 조회 ---
        // 사용자와 상품 ID를 기준으로 자동 입찰 설정을 찾습니다.
        AutoBid autoBid = autoBidRepository.findByUser_IdAndProduct_Id(user.getId(), productId)
                .orElseThrow(() -> new IllegalStateException("취소할 자동 입찰 설정이 없습니다."));

        // --- 3. 자동 입찰 삭제 ---
        autoBidRepository.delete(autoBid);
        log.info("사용자 {}의 상품 ID {} 자동 입찰 설정 취소 완료.", user.getName(), productId);

        // --- 4. 취소 후 다른 자동 입찰 경쟁 유발 ---
        // 이 상품에 다른 자동 입찰자가 남아있을 수 있으므로,
        // 현재 최고 입찰자를 기준으로 자동 입찰 경쟁을 다시 시도합니다.
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("자동 입찰 취소 후 상품 정보를 찾을 수 없습니다. ID: " + productId));
        processAutoBids(product);
    }
}
