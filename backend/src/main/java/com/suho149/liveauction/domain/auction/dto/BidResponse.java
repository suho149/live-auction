package com.suho149.liveauction.domain.auction.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BidResponse {
    private Long productId;
    private Long newPrice;
    private String bidderName;
}
