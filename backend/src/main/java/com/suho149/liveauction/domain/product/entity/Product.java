package com.suho149.liveauction.domain.product.entity;

import com.suho149.liveauction.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Lob
    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private Long startPrice;

    @Column(nullable = false)
    private Long currentPrice;

    private String imageUrl; // 이미지 URL

    @Column(nullable = false)
    private LocalDateTime auctionEndTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "highest_bidder_id")
    private User highestBidder;

    @Builder
    public Product(String name, String description, Long startPrice, String imageUrl, LocalDateTime auctionEndTime, User seller) {
        this.name = name;
        this.description = description;
        this.startPrice = startPrice;
        this.currentPrice = startPrice; // 시작가는 현재가와 동일
        this.imageUrl = imageUrl;
        this.auctionEndTime = auctionEndTime;
        this.seller = seller;
    }

    // 입찰 시 현재가와 최고 입찰자 업데이트
    public void updateBid(User bidder, Long bidAmount) {
        this.highestBidder = bidder;
        this.currentPrice = bidAmount;
    }
}
