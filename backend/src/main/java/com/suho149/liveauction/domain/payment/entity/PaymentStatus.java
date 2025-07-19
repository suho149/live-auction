package com.suho149.liveauction.domain.payment.entity;

public enum PaymentStatus {
    PENDING, // 결제 대기 중
    COMPLETED, // 결제 완료
    CANCELED, // 결제 취소
    FAILED // 결제 실패
}
