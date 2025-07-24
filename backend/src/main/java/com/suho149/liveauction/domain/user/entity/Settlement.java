package com.suho149.liveauction.domain.user.entity;

import com.suho149.liveauction.domain.payment.entity.Payment;
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

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false, unique = true)
    private Payment payment; // ★ 어떤 결제 건에 대한 정산인지 연결

    private LocalDateTime requestedAt; // 요청 일시

    private LocalDateTime completedAt; // 처리 일시

    @Builder
    public Settlement(User seller, Long amount, Payment payment) {
        this.seller = seller;
        this.amount = amount;
        this.payment = payment;

        // 생성 시 초기 상태는 '정산 가능'
        this.status = SettlementStatus.AVAILABLE;
        // requestedAt은 요청 시에만 설정되므로 여기서 null로 둠
    }

    // 정산 요청 메소드
    public void request() {
        if (this.status != SettlementStatus.AVAILABLE) {
            throw new IllegalStateException("정산 가능한 상태가 아닙니다.");
        }
        this.status = SettlementStatus.REQUESTED;
        this.requestedAt = LocalDateTime.now();
    }

    // 정산 완료 메소드
    public void complete() {
        if (this.status != SettlementStatus.REQUESTED) {
            throw new IllegalStateException("정산 요청된 상태가 아닙니다.");
        }
        this.status = SettlementStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }
}
