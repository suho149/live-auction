package com.suho149.liveauction.scheduler;

import com.suho149.liveauction.domain.delivery.entity.Delivery;
import com.suho149.liveauction.domain.delivery.entity.DeliveryStatus;
import com.suho149.liveauction.domain.delivery.repository.DeliveryRepository;
import com.suho149.liveauction.domain.notification.entity.NotificationType;
import com.suho149.liveauction.domain.notification.service.NotificationService;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class DeliveryScheduler {
    private final DeliveryRepository deliveryRepository;
    private final NotificationService notificationService;

    /**
     * 매일 평일 오후 4시에 실행되어, '배송 준비 중'인 모든 주문을 일괄 '발송 처리'합니다.
     * (실제 택배사 연동 시뮬레이션)
     */
//    @Scheduled(cron = "0 0 16 * * MON-FRI") // 평일 오후 4시 정각
    @Scheduled(cron = "0 * * * * *") // 1분마다 실행되도록 변경(테스트용)
    @Transactional
    public void processDailyShipments() {
        log.info("일일 배송 일괄 처리 스케줄러 시작...");

        // 1. '배송 준비 중(PENDING)' 상태인 모든 배송 건 조회
        List<Delivery> deliveriesToShip = deliveryRepository.findByStatus(DeliveryStatus.PENDING);

        if (deliveriesToShip.isEmpty()) {
            log.info("발송할 배송 건이 없습니다.");
            return;
        }

        log.info("총 {}건의 배송을 처리합니다.", deliveriesToShip.size());

        for (Delivery delivery : deliveriesToShip) {
            // 2. 가상의 운송장 번호 생성
            String trackingNumber = "CJ" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();

            // 3. 발송 처리 (상태 변경 및 운송장 번호 저장)
            delivery.ship(trackingNumber);

            // 4. 구매자에게 알림 발송
            String content = "'" + delivery.getPayment().getProduct().getName() + "' 상품이 발송되었습니다!";
            notificationService.send(
                    delivery.getPayment().getBuyer(),
                    NotificationType.DELIVERY,
                    content,
                    "/mypage" // 나의 경매 페이지로 링크
            );
        }
        log.info("일일 배송 일괄 처리 완료.");
    }

    @Scheduled(cron = "0 0 1 * * *") // 매일 새벽 1시에 실행
    @Transactional
    public void autoConfirmDeliveries() {
        // 배송 완료(COMPLETED)된 지 7일이 지난 Delivery 목록 조회
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<Delivery> deliveriesToConfirm = deliveryRepository.findByStatusAndCompletedAtBefore(DeliveryStatus.COMPLETED, sevenDaysAgo);

        for (Delivery delivery : deliveriesToConfirm) {
            delivery.confirmPurchase();

            Product product = delivery.getPayment().getProduct();
            User seller = product.getSeller();

            log.info("배송 ID {} 자동 구매 확정 처리.", delivery.getId());

            // --- TODO: 판매자에게 자동 구매 확정 알림 발송 ---
            String content = "'" + product.getName() + "' 상품의 구매가 자동으로 확정되었습니다. 정산 내역을 확인해주세요.";
            String url = "/mypage?tab=settlement";
            notificationService.send(seller, NotificationType.DELIVERY, content, url);

            // --- 자동 확정 시에도 정산 가능 금액 업데이트 ---
//            seller.addSettlementAmount(delivery.getPayment().getAmount());
        }
    }
}
