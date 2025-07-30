package com.suho149.liveauction.domain.product.entity;

public enum ReportReason {
    SPAM,          // 스팸/홍보성 게시물
    FRAUD,         // 사기 의심
    INAPPROPRIATE, // 음란물/욕설 등 부적절한 내용
    IP_INFRINGEMENT, // 지식재산권 침해
    OTHER          // 기타
}
