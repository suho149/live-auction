package com.suho149.liveauction.domain.auction.entity;

import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
// 한 사용자는 한 상품에 하나의 자동 입찰만 설정할 수 있도록 유니크 제약 조건 추가
@Table(uniqueConstraints = {@UniqueConstraint(columnNames = {"user_id", "product_id"})})
public class AutoBid {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Long maxAmount; // 사용자가 설정한 최대 입찰 금액

    @Builder
    public AutoBid(User user, Product product, Long maxAmount) {
        this.user = user;
        this.product = product;
        this.maxAmount = maxAmount;
    }

    public void updateMaxAmount(Long newMaxAmount) {
        this.maxAmount = newMaxAmount;
    }
}
