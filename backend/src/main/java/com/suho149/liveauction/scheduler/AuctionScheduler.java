package com.suho149.liveauction.scheduler;

import com.suho149.liveauction.domain.notification.entity.NotificationType;
import com.suho149.liveauction.domain.notification.service.NotificationService;
import com.suho149.liveauction.domain.payment.entity.Payment;
import com.suho149.liveauction.domain.payment.entity.PaymentStatus;
import com.suho149.liveauction.domain.payment.repository.PaymentRepository;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.entity.ProductStatus;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuctionScheduler {
    private final ProductRepository productRepository;
    private final NotificationService notificationService;
    private final PaymentRepository paymentRepository;
    private static final int PENDING_EXPIRATION_MINUTES = 10;

    /**
     * 매 분 0초에 실행되어, 마감 시간이 지난 경매를 처리합니다.
     */
    @Scheduled(cron = "0 * * * * *") // 매 분마다 실행
    @Transactional
    public void closeExpiredAuctions() {
        log.info("경매 마감 스케줄러 실행: {}", LocalDateTime.now());

        List<Product> productsToEnd = productRepository.findByStatusAndAuctionEndTimeBefore(ProductStatus.ON_SALE, LocalDateTime.now());

        if (productsToEnd.isEmpty()) {
            log.info("마감할 경매가 없습니다.");
            return;
        }

        for (Product product : productsToEnd) {
            String url = "/products/" + product.getId();

            if (product.getHighestBidder() != null) {
                // --- 낙찰된 경우 ---
                product.endAuctionWithWinner();

                // 낙찰자에게 알림 발송
                String winnerContent = "'" + product.getName() + "' 상품에 최종 낙찰되었습니다! 24시간 내에 결제를 완료해주세요.";
                notificationService.send(product.getHighestBidder(), NotificationType.BID, winnerContent, url);
                log.info("상품 ID {} 낙찰 처리 완료. 낙찰자: {}", product.getId(), product.getHighestBidder().getName());
            } else {
                // --- 유찰된 경우 ---
                product.endAuctionWithNoBidder();

                // 판매자에게 유찰 알림 발송
                String sellerContent = "등록하신 '" + product.getName() + "' 상품이 입찰자 없이 유찰되었습니다.";
                notificationService.send(product.getSeller(), NotificationType.BID, sellerContent, url);
                log.info("상품 ID {} 유찰 처리 완료.", product.getId());
            }
        }
    }

    @Scheduled(cron = "30 * * * * *") // 매 분 30초에 실행
    @Transactional
    public void expireOverduePayments() {
        log.info("결제 기한 만료 스케줄러 실행: {}", LocalDateTime.now());

        List<Product> overdueProducts = productRepository.findByStatusAndPaymentDueDateBefore(ProductStatus.AUCTION_ENDED, LocalDateTime.now());

        for (Product product : overdueProducts) {
            product.expirePayment();

            String url = "/products/" + product.getId();
            String content = "'" + product.getName() + "' 상품의 낙찰자가 24시간 내에 결제하지 않아 거래가 취소되었습니다.";

            // 판매자와 낙찰자 모두에게 알림
            notificationService.send(product.getSeller(), NotificationType.BID, content, url);
            notificationService.send(product.getHighestBidder(), NotificationType.BID, content, url);

            log.info("상품 ID {} 결제 기한 만료 처리 완료.", product.getId());
        }
    }

    /**
     * 10분마다 실행되어, 생성된 지 오래된 PENDING 상태의 결제 정보를 삭제합니다.
     * (사용자가 결제창을 열었다가 그냥 닫아버린 경우 등)
     */
    @Scheduled(cron = "0 */10 * * * *") // 매 10분마다 실행
    @Transactional
    public void cleanupExpiredPendingPayments() {
        LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(PENDING_EXPIRATION_MINUTES);
        log.info("만료된 PENDING 결제 정리 스케줄러 실행. 기준 시간: {}", tenMinutesAgo);

        List<Payment> expiredPayments = paymentRepository.findByStatusAndCreatedAtBefore(PaymentStatus.PENDING, tenMinutesAgo);

        if (!expiredPayments.isEmpty()) {
            log.info("{}개의 만료된 PENDING 결제를 삭제합니다.", expiredPayments.size());
            paymentRepository.deleteAll(expiredPayments);
        }
    }
}
