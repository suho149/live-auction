package com.suho149.liveauction.domain.product.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ProductCreateRequest {
    private String name;
    private String description;
    private Long startPrice;
    private String imageUrl;
    private LocalDateTime auctionEndTime;
}
