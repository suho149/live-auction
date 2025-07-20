package com.suho149.liveauction.domain.product.entity;

public enum ProductStatus {
    ON_SALE,        // 판매 중 (입찰 가능)
    AUCTION_ENDED,  // 경매 종료 (결제 대기)
    SOLD_OUT,       // 판매 완료 (결제 완료)
    EXPIRED,        // 결제 기한 만료
    FAILED          // 유찰 (최고 입찰자 없음)
}
