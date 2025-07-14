package com.suho149.liveauction.domain.product.entity;

import com.suho149.liveauction.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    @Column(nullable = false)
    private LocalDateTime auctionEndTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "highest_bidder_id")
    private User highestBidder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductImage> images = new ArrayList<>();

    @Builder
    public Product(String name, String description, Long startPrice, Category category, LocalDateTime auctionEndTime, User seller) {
        this.name = name;
        this.description = description;
        this.startPrice = startPrice;
        this.currentPrice = startPrice;
        this.category = category;
        this.auctionEndTime = auctionEndTime;
        this.seller = seller;
    }

    // ★ 연관관계 편의 메소드 추가
    public void addImage(ProductImage image) {
        this.images.add(image);
    }

    // 입찰 시 현재가와 최고 입찰자 업데이트
    public void updateBid(User bidder, Long bidAmount) {
        this.highestBidder = bidder;
        this.currentPrice = bidAmount;
    }
}
