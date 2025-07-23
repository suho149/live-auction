package com.suho149.liveauction.domain.delivery.service;

import com.suho149.liveauction.domain.delivery.dto.DeliveryInfoRequest;
import com.suho149.liveauction.domain.delivery.dto.ShipRequest;
import com.suho149.liveauction.domain.delivery.entity.Address;
import com.suho149.liveauction.domain.delivery.entity.Delivery;
import com.suho149.liveauction.domain.delivery.repository.DeliveryRepository;
import com.suho149.liveauction.domain.notification.entity.NotificationType;
import com.suho149.liveauction.domain.notification.service.NotificationService;
import com.suho149.liveauction.domain.payment.entity.Payment;
import com.suho149.liveauction.domain.payment.repository.PaymentRepository;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}
