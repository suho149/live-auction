package com.suho149.liveauction.domain.auction.entity;

import com.suho149.liveauction.domain.product.entity.Product;
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
public class Bid {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidder_id", nullable = false)
    private User bidder;

    @Column(nullable = false)
    private Long amount;

    @Column(nullable = false)
    private LocalDateTime bidTime;

    @Builder
    public Bid(Product product, User bidder, Long amount) {
        this.product = product;
        this.bidder = bidder;
        this.amount = amount;
        this.bidTime = LocalDateTime.now();
    }
}
