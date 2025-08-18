package com.suho149.liveauction.domain.delivery.service;

import com.suho149.liveauction.domain.delivery.dto.DeliveryInfoRequest;
import com.suho149.liveauction.domain.delivery.dto.ShipRequest;
import com.suho149.liveauction.domain.delivery.dto.TrackingInfo;
import com.suho149.liveauction.domain.delivery.entity.Address;
import com.suho149.liveauction.domain.delivery.entity.Delivery;
import com.suho149.liveauction.domain.delivery.entity.DeliveryStatus;
import com.suho149.liveauction.domain.delivery.repository.DeliveryRepository;
import com.suho149.liveauction.domain.notification.entity.NotificationType;
import com.suho149.liveauction.domain.notification.service.NotificationService;
import com.suho149.liveauction.domain.payment.entity.Payment;
import com.suho149.liveauction.domain.payment.repository.PaymentRepository;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.service.SettlementService;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliveryService {
    private final DeliveryRepository deliveryRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final SettlementService settlementService;

    @Transactional
    public void updateDeliveryInfo(Long paymentId, DeliveryInfoRequest request, UserPrincipal userPrincipal) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("배송 정보를 업데이트할 결제 내역을 찾을 수 없습니다. ID: " + paymentId));

        Delivery delivery = payment.getDelivery(); // Payment와 Delivery는 1:1 관계
        if (delivery == null) {
            // 이 경우는 데이터 정합성이 깨진 심각한 상황
            throw new IllegalStateException("결제에 해당하는 배송 정보가 존재하지 않습니다. Payment ID: " + paymentId);
        }

        // 본인 확인 (구매자만 배송지 입력 가능)
        if (!payment.getBuyer().getId().equals(userPrincipal.getId())) {
            throw new IllegalStateException("배송 정보를 입력할 권한이 없습니다.");
        }

        Address newAddress = new Address(
                request.getRecipientName(), request.getRecipientPhone(),
                request.getPostalCode(), request.getMainAddress(), request.getDetailAddress()
        );
        delivery.updateAddress(newAddress);
    }

    @Transactional
    public void shipProduct(Long deliveryId, ShipRequest request, UserPrincipal userPrincipal) {
        // --- 1. 배송 정보 조회 ---
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("발송 처리할 배송 정보를 찾을 수 없습니다. ID: " + deliveryId));

        // --- 2. 권한 확인 (판매자 본인만 가능) ---
        // 연관관계를 통해 판매자 정보를 가져옴
        User seller = delivery.getPayment().getProduct().getSeller();
        if (!seller.getId().equals(userPrincipal.getId())) {
            throw new IllegalStateException("상품을 발송 처리할 권한이 없습니다.");
        }

        // --- 3. 발송 처리 ---
        // (운송장 번호, 택배사 코드, 택배사 이름을 함께 저장)
        delivery.ship(request.getCarrierId(), request.getCarrierName(), request.getTrackingNumber());

        // --- 4. 구매자에게 알림 발송 ---
        User buyer = delivery.getPayment().getBuyer();
        String productName = delivery.getPayment().getProduct().getName();
        String url = "/mypage"; // 구매 내역 페이지로 이동시키면 좋음

        String content = "'" + productName + "' 상품이 발송되었습니다! 마이페이지에서 배송 상태를 확인하세요.";

        notificationService.send(buyer, NotificationType.CHAT, content, url); // CHAT 타입 또는 새로운 DELIVERY 타입을 만들어도 좋음
    }

    @Transactional(readOnly = true)
    public TrackingInfo getTrackingInfo(String trackingNumber) { // ★ 파라미터를 trackingNumber 하나만 받도록 복원
        // ★ JOIN FETCH를 사용한 DB 조회를 유지하여 성능 최적화
        Delivery delivery = deliveryRepository.findWithDetailsByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 운송장 번호입니다."));

        Product product = delivery.getPayment().getProduct();
        LocalDateTime shippedAt = delivery.getShippedAt();

        // shippedAt이 null이면 (아직 발송 처리 전이면) 빈 이력 반환
        if (shippedAt == null) {
            return new TrackingInfo(trackingNumber, delivery.getCarrierName(), product.getSeller().getName(), delivery.getAddress().getRecipientName(), product.getName(), new ArrayList<>());
        }

        LocalDateTime now = LocalDateTime.now();
        long minutesPassed = Duration.between(shippedAt, now).toMinutes();

        List<TrackingInfo.TrackingDetail> history = new ArrayList<>();
        history.add(new TrackingInfo.TrackingDetail(shippedAt, "판매자 위치", "상품인수", "판매자로부터 상품을 인수했습니다."));
        if (minutesPassed > 1) history.add(new TrackingInfo.TrackingDetail(shippedAt.plusMinutes(30), "수도권 허브", "집화처리", "터미널에 상품이 입고되었습니다."));
        if (minutesPassed > 2) history.add(new TrackingInfo.TrackingDetail(shippedAt.plusHours(2), "수도권 허브", "간선상차", "목적지로 가는 트럭에 실었습니다."));
        if (minutesPassed > 3) history.add(new TrackingInfo.TrackingDetail(shippedAt.plusHours(10), "배송 지역 허브", "간선하차", "목적지 터미널에 상품이 도착했습니다."));
        if (minutesPassed > 4) history.add(new TrackingInfo.TrackingDetail(shippedAt.plusHours(12), "배송 지역 대리점", "배달출발", "배송 기사님이 배달을 시작했습니다."));
        if (minutesPassed > 5) history.add(new TrackingInfo.TrackingDetail(shippedAt.plusHours(14), "구매자 주소", "배달완료", "배송이 완료되었습니다."));

        return new TrackingInfo(
                trackingNumber,
                delivery.getCarrierName(), // 택배사 이름 추가
                product.getSeller().getName(),
                delivery.getAddress().getRecipientName(),
                product.getName(),
                history
        );
    }

    @Transactional
    public void confirmPurchase(Long deliveryId, UserPrincipal userPrincipal) {
        // --- 1. orElseThrow 완성 ---
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("구매 확정할 배송 정보를 찾을 수 없습니다. ID: " + deliveryId));

        // --- 2. 구매자 본인 확인 ---
        if (!delivery.getPayment().getBuyer().getId().equals(userPrincipal.getId())) {
            throw new IllegalStateException("구매 확정 권한이 없습니다.");
        }

        // --- 3. 배송 완료 상태인지 확인 ---
        if (delivery.getStatus() != DeliveryStatus.COMPLETED) {
            throw new IllegalStateException("배송이 완료된 상품만 구매 확정할 수 있습니다.");
        }

        // --- 4. 상태 변경 ---
        delivery.confirmPurchase();

        Product product = delivery.getPayment().getProduct();
        User seller = product.getSeller();

        // 구매가 확정되었으므로, 이 거래에 대한 정산을 생성
        settlementService.createSettlement(delivery.getPayment());

        // 판매자에게 알림 발송
        String content = "'" + product.getName() + "' 상품에 대해 구매자가 구매를 확정했습니다. 정산 내역을 확인해주세요.";
        String url = "/mypage?tab=settlement"; // 마이페이지의 정산 탭으로 바로 이동
        notificationService.send(seller, NotificationType.DELIVERY, content, url);
    }
}
