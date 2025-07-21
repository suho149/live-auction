package com.suho149.liveauction.domain.product.dto;

import com.suho149.liveauction.domain.product.entity.Category;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class ProductCreateRequest {
    private String name;
    private String description;
    private Long startPrice;
    private Category category; // 카테고리 추가
    private LocalDateTime auctionEndTime;
    private List<String> imageUrls; // 다중 이미지 URL 목록
    private Long buyNowPrice;
}
