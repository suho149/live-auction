package com.suho149.liveauction.domain.delivery.service;

import com.suho149.liveauction.domain.delivery.dto.DeliveryInfoRequest;
import com.suho149.liveauction.domain.delivery.dto.ShipRequest;
import com.suho149.liveauction.domain.delivery.dto.TrackingInfo;
import com.suho149.liveauction.domain.delivery.entity.Address;
import com.suho149.liveauction.domain.delivery.entity.Delivery;
import com.suho149.liveauction.domain.delivery.repository.DeliveryRepository;
import com.suho149.liveauction.domain.notification.entity.NotificationType;
import com.suho149.liveauction.domain.notification.service.NotificationService;
import com.suho149.liveauction.domain.payment.entity.Payment;
import com.suho149.liveauction.domain.payment.repository.PaymentRepository;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliveryService {
    private final DeliveryRepository deliveryRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;

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
        // (운송장 번호와 상태를 업데이트하고 발송 시간을 기록)
        delivery.ship(request.getTrackingNumber());

        // --- 4. 구매자에게 알림 발송 ---
        User buyer = delivery.getPayment().getBuyer();
        String productName = delivery.getPayment().getProduct().getName();
        String url = "/mypage"; // 구매 내역 페이지로 이동시키면 좋음

        String content = "'" + productName + "' 상품이 발송되었습니다! 마이페이지에서 배송 상태를 확인하세요.";

        notificationService.send(buyer, NotificationType.CHAT, content, url); // CHAT 타입 또는 새로운 DELIVERY 타입을 만들어도 좋음
    }

    @Transactional(readOnly = true)
    public TrackingInfo getTrackingInfo(String trackingNumber) {
        // 실제라면 DB에서 trackingNumber로 Delivery 정보를 찾겠지만, 포트폴리오용이므로
        // trackingNumber 자체에 정보를 담거나, 간단히 조회하는 척만 합니다.
        Delivery delivery = deliveryRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 운송장 번호입니다."));

        Product product = delivery.getPayment().getProduct();
        LocalDateTime shippedAt = delivery.getShippedAt();
        LocalDateTime now = LocalDateTime.now();

        // 발송 시간으로부터 현재까지의 시간을 분 단위로 계산
        long minutesPassed = Duration.between(shippedAt, now).toMinutes();

        List<TrackingInfo.TrackingDetail> history = new ArrayList<>();

        // 시나리오 기반 가상 이력 생성
        // 1. 상품 인수 (발송 직후)
        history.add(new TrackingInfo.TrackingDetail(shippedAt, "판매자 위치", "상품인수", "판매자로부터 상품을 인수했습니다."));

        // 2. 집화 처리 (발송 30분 후)
        if (minutesPassed > 1) {
            history.add(new TrackingInfo.TrackingDetail(shippedAt.plusMinutes(30), "서울 마포 허브", "집화처리", "터미널에 상품이 입고되었습니다."));
        }

        // 3. 간선 상차 (발송 2시간 후)
        if (minutesPassed > 2) {
            history.add(new TrackingInfo.TrackingDetail(shippedAt.plusHours(2), "서울 마포 허브", "간선상차", "부산으로 가는 트럭에 상품을 실었습니다."));
        }

        // 4. 간선 하차 (발송 10시간 후)
        if (minutesPassed > 3) {
            history.add(new TrackingInfo.TrackingDetail(shippedAt.plusHours(10), "부산 사상 허브", "간선하차", "목적지 터미널에 상품이 도착했습니다."));
        }

        // 5. 배달 출발 (발송 12시간 후)
        if (minutesPassed > 4) {
            history.add(new TrackingInfo.TrackingDetail(shippedAt.plusHours(12), "구매자 주소 근처", "배달출발", "배송 기사님이 배달을 시작했습니다."));
        }

        // 6. 배달 완료 (발송 14시간 후)
        if (minutesPassed > 5) {
            history.add(new TrackingInfo.TrackingDetail(shippedAt.plusHours(14), "구매자 주소", "배달완료", "배송이 완료되었습니다."));
            // 실제라면 이때 Delivery 상태를 COMPLETED로 변경하는 로직이 필요
        }

        return new TrackingInfo(
                trackingNumber,
                product.getSeller().getName(),
                delivery.getAddress().getRecipientName(),
                product.getName(),
                history
        );
    }
}
