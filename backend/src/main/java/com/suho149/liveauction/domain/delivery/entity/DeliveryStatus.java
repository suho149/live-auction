package com.suho149.liveauction.domain.delivery.entity;

public enum DeliveryStatus {
    ADDRESS_PENDING, // 배송지 입력 대기
    PENDING,         // 배송 준비 중
    SHIPPING,        // 배송 중
    COMPLETED,       // 배송 완료
    CANCELED         // 주문 취소
}
