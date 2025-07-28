package com.suho149.liveauction.domain.product.entity;

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
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author; // 질문 작성자

    @Column(nullable = false, length = 1000)
    private String content;

    @Lob // 답변은 길 수 있으므로 CLOB 타입으로 설정
    private String answer; // 판매자의 답변

    @Column(nullable = false)
    private boolean isPrivate; // 비밀글 여부

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime answeredAt; // 답변 일시

    @Builder
    public Question(Product product, User author, String content, boolean isPrivate) {
        this.product = product;
        this.author = author;
        this.content = content;
        this.isPrivate = isPrivate;
    }

    public void addAnswer(String answer) {
        this.answer = answer;
        this.answeredAt = LocalDateTime.now();
    }
}