package com.suho149.liveauction.domain.product.entity;

import com.suho149.liveauction.domain.user.entity.Like;
import com.suho149.liveauction.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus status = ProductStatus.ON_SALE; // 기본값은 '판매 중'

    @Column(nullable = false)
    private LocalDateTime auctionEndTime;

    @Column(nullable = false)
    private int likeCount = 0; // 찜 개수 필드 추가, 기본값 0

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

    // Product가 삭제될 때 연관된 Like도 함께 삭제되도록 설정
    @OneToMany(mappedBy = "product", cascade = CascadeType.REMOVE)
    private Set<Like> likes = new HashSet<>();

    private LocalDateTime paymentDueDate;

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

    // 연관관계 편의 메소드 추가
    public void addImage(ProductImage image) {
        this.images.add(image);
    }

    // 입찰 시 현재가와 최고 입찰자 업데이트
    public void updateBid(User bidder, Long bidAmount) {
        this.highestBidder = bidder;
        this.currentPrice = bidAmount;
    }

    // 상품 정보 수정을 위한 메소드
    public void updateDetails(String name, String description, Category category) {
        this.name = name;
        this.description = description;
        this.category = category;
    }

    // 찜 개수 업데이트 메소드
    public void increaseLikeCount() {
        this.likeCount++;
    }

    public void decreaseLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--;
        }
    }

    public void soldOut() {
        this.status = ProductStatus.SOLD_OUT;
    }

    public void endAuctionWithWinner() {
        this.status = ProductStatus.AUCTION_ENDED;
        this.paymentDueDate = LocalDateTime.now().plusHours(24);
    }

    public void endAuctionWithNoBidder() {
        this.status = ProductStatus.FAILED;
    }

    public void expirePayment() {
        this.status = ProductStatus.EXPIRED;
    }

    public void extendAuctionEndTime(LocalDateTime newEndTime) {
        this.auctionEndTime = newEndTime;
    }
}
