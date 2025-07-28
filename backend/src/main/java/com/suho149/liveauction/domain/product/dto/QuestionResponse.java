package com.suho149.liveauction.domain.product.dto;

import com.suho149.liveauction.domain.product.entity.Question;
import com.suho149.liveauction.domain.user.entity.User;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;

@Slf4j
@Getter
public class QuestionResponse {
    private final Long questionId;
    private final String authorName;
    private final String content;
    private final String answer;
    private final boolean isPrivate;
    private final LocalDateTime createdAt;
    private final LocalDateTime answeredAt;
    private final boolean canBeViewed;

    public QuestionResponse(Question question, User currentUser) {
        // --- 1. final이 아닌 일반 로컬 변수를 선언 ---
        String tempAuthorName;
        String tempContent;
        String tempAnswer;

        // --- 2. 권한 확인 로직 (기존과 동일) ---
        this.questionId = question.getId();
        this.isPrivate = question.isPrivate();
        this.createdAt = question.getCreatedAt();
        this.answeredAt = question.getAnsweredAt();

        boolean isPublic = !question.isPrivate();
        boolean isUserLoggedIn = currentUser != null;
        boolean isAuthor = isUserLoggedIn && currentUser.getId().equals(question.getAuthor().getId());
        boolean isSeller = isUserLoggedIn && currentUser.getId().equals(question.getProduct().getSeller().getId());
        this.canBeViewed = isPublic || (isAuthor || isSeller);

        // --- 3. if-else 분기문에서 로컬 변수에 값을 할당 ---
        if (this.canBeViewed) {
            // 내가 글을 볼 수 있는 경우
            tempAuthorName = question.getAuthor().getName();
            tempContent = question.getContent();
            tempAnswer = question.getAnswer();
        } else {
            // 내가 글을 볼 수 없는 비밀글인 경우
            tempAuthorName = "비공개";
            tempContent = "비밀글입니다.";

            if (question.getAnswer() != null) {
                tempAnswer = "판매자가 답변을 완료했습니다.";
            } else {
                tempAnswer = null;
            }
        }

        // --- 4. 생성자 마지막에서, 결정된 값들을 final 필드에 단 한 번만 할당 ---
        this.authorName = tempAuthorName;
        this.content = tempContent;
        this.answer = tempAnswer;
    }
}
