package com.suho149.liveauction.domain.user.entity;

public enum SettlementStatus {
    PENDING,    // 정산 요청 (대기중)
    COMPLETED,  // 정산 완료
    REJECTED    // 정산 거절
}
