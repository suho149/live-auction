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
    private final boolean canBeViewed; // 현재 사용자가 이 질문을 볼 수 있는지 여부

    public QuestionResponse(Question question, User currentUser) {
        this.questionId = question.getId();
        this.authorName = question.getAuthor().getName();
        this.isPrivate = question.isPrivate();
        this.createdAt = question.getCreatedAt();
        this.answeredAt = question.getAnsweredAt();

        boolean isPublic = !question.isPrivate();
        boolean isUserLoggedIn = currentUser != null;
        boolean isAuthor = false;
        boolean isSeller = false;

        if (isUserLoggedIn) {

            isAuthor = currentUser.getId().equals(question.getAuthor().getId());
            isSeller = currentUser.getId().equals(question.getProduct().getSeller().getId());
        } else {
            log.info("현재 사용자는 로그인하지 않았습니다.");
        }

        // 최종 권한 계산
        this.canBeViewed = isPublic || (isUserLoggedIn && (isAuthor || isSeller));

        // 볼 수 있는 경우에만 내용과 답변을 채움
        if (this.canBeViewed) {
            this.content = question.getContent();
            this.answer = question.getAnswer();
        } else {
            this.content = "비밀글입니다.";
            this.answer = null;
        }
    }
}
