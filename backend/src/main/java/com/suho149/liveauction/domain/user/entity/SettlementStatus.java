package com.suho149.liveauction.domain.user.entity;

public enum SettlementStatus {
    AVAILABLE,  // 정산 가능 (구매 확정 직후 상태)
    REQUESTED,  // 정산 요청 (판매자가 요청한 상태)
    COMPLETED,  // 정산 완료 (관리자가 처리한 상태)
    REJECTED    // 정산 거절
}
