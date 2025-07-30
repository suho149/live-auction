package com.suho149.liveauction.domain.user.entity;

import com.suho149.liveauction.domain.delivery.entity.Address;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "users") // 'user'는 DB 예약어인 경우가 많아 'users'를 사용합니다.
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column
    private String picture;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private double ratingScore = 0.0;

    private int reviewCount = 0;

    private int salesCount = 0;

    @Embedded // 기본 배송지 정보를 User 테이블에 포함
    private Address defaultAddress;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public User(String name, String email, String picture, Role role) {
        this.name = name;
        this.email = email;
        this.picture = picture;
        this.role = role;
    }

    public User update(String name, String picture) {
        this.name = name;
        this.picture = picture;
        return this;
    }

    public String getRoleKey() {
        return this.role.getKey();
    }

    // 리뷰를 받았을 때 평점을 업데이트하는 메소드
    public void addReview(int newRating) {
        this.ratingScore = ((this.ratingScore * this.reviewCount) + newRating) / (this.reviewCount + 1);
        this.reviewCount++;
    }

    // 판매가 완료되었을 때 호출할 메소드
    public void incrementSalesCount() {
        this.salesCount++;
    }

    // 기본 배송지 업데이트 메소드
    public void updateDefaultAddress(Address newAddress) {
        this.defaultAddress = newAddress;
    }

    public void updateRole(Role role) {
        this.role = role;
    }
}
