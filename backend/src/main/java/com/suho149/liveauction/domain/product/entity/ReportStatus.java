package com.suho149.liveauction.domain.product.entity;

public enum ReportStatus {
    PENDING,  // 처리 대기 중
    ACCEPTED, // 신고 승인 (상품 삭제 처리)
    REJECTED  // 신고 기각
}