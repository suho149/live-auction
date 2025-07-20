package com.suho149.liveauction.domain.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Settlement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @Column(nullable = false)
    private Long amount; // 정산 요청 금액

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SettlementStatus status;

    @Column(nullable = false)
    private LocalDateTime requestedAt; // 요청 일시

    private LocalDateTime completedAt; // 처리 일시

    @Builder
    public Settlement(User seller, Long amount) {
        this.seller = seller;
        this.amount = amount;
        this.status = SettlementStatus.PENDING;
        this.requestedAt = LocalDateTime.now();
    }

    public void complete() {
        this.status = SettlementStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }
}
