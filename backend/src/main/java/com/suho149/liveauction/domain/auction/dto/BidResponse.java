package com.suho149.liveauction.domain.auction.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BidResponse {
    private Long productId;
    private Long newPrice;
    private String bidderName;
    private final LocalDateTime auctionEndTime; // 연장된 마감 시간 필드 추가
}
