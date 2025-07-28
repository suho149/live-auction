package com.suho149.liveauction.domain.product.dto;

import com.suho149.liveauction.domain.product.entity.Question;
import com.suho149.liveauction.domain.user.entity.User;
import lombok.Getter;

import java.time.LocalDateTime;

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

        // 비밀글 조회 권한 확인
        this.canBeViewed = !question.isPrivate() || // 공개글이거나
                (currentUser != null && ( // 로그인했고
                        currentUser.getId().equals(question.getAuthor().getId()) || // 내가 작성자이거나
                                currentUser.getId().equals(question.getProduct().getSeller().getId()) // 내가 판매자인 경우
                ));

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
