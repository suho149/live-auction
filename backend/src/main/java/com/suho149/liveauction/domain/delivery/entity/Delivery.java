package com.suho149.liveauction.domain.delivery.entity;

import com.suho149.liveauction.domain.payment.entity.Payment;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Delivery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false, unique = true)
    private Payment payment;

    @Embedded
    private Address address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryStatus status;

    private String trackingNumber; // 운송장 번호
    private LocalDateTime shippedAt; // 발송 일시

    @Builder
    public Delivery(Payment payment) {
        this.payment = payment;
        this.status = DeliveryStatus.ADDRESS_PENDING; // 초기 상태는 '배송지 입력 대기'
    }

    // 배송지 정보 업데이트 메소드
    public void updateAddress(Address newAddress) {
        this.address = newAddress;
        this.status = DeliveryStatus.PENDING; // 배송지 입력 완료 -> '배송 준비 중'
    }

    // 발송 처리 메소드
    public void ship(String trackingNumber) {
        this.trackingNumber = trackingNumber;
        this.status = DeliveryStatus.SHIPPING;
        this.shippedAt = LocalDateTime.now();
    }
}
