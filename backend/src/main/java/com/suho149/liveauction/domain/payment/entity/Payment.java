package com.suho149.liveauction.domain.payment.entity;

import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @Column(nullable = false, unique = true)
    private String orderId; // 토스페이먼츠와 통신할 고유 주문 ID

    @Column(nullable = false)
    private Long amount; // 결제 금액

    private String paymentKey; // 결제 승인 후 토스페이먼츠로부터 받는 키

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    private LocalDateTime paidAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt; // 생성 시간

    @Builder
    public Payment(Product product, User buyer, String orderId, Long amount) {
        this.product = product;
        this.buyer = buyer;
        this.orderId = orderId;
        this.amount = amount;
        this.status = PaymentStatus.PENDING; // 초기 상태는 '결제 대기'
    }

    public void completePayment(String paymentKey) {
        this.paymentKey = paymentKey;
        this.status = PaymentStatus.COMPLETED;
        this.paidAt = LocalDateTime.now();
    }
}
