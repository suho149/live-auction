package com.suho149.liveauction.domain.user.entity;

import com.suho149.liveauction.domain.product.entity.Product;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(uniqueConstraints = {
        // 한 사용자는 한 상품에 대해 한 명의 상대방에게만 리뷰를 남길 수 있음
        @UniqueConstraint(columnNames = {"reviewer_id", "reviewee_id", "product_id"})
})
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer; // 리뷰를 작성한 사람

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewee_id", nullable = false)
    private User reviewee; // 리뷰를 받은 사람

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product; // 어떤 거래에 대한 리뷰인지

    @Column(nullable = false)
    private int rating; // 평점 (1~5)

    @Column(length = 500)
    private String comment; // 리뷰 내용

    @Builder
    public Review(User reviewer, User reviewee, Product product, int rating, String comment) {
        this.reviewer = reviewer;
        this.reviewee = reviewee;
        this.product = product;
        this.rating = rating;
        this.comment = comment;
    }
}
