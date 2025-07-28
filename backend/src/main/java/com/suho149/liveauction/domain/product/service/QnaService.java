package com.suho149.liveauction.domain.product.service;

import com.suho149.liveauction.domain.notification.entity.NotificationType;
import com.suho149.liveauction.domain.notification.service.NotificationService;
import com.suho149.liveauction.domain.product.dto.AnswerRequest;
import com.suho149.liveauction.domain.product.dto.QuestionRequest;
import com.suho149.liveauction.domain.product.dto.QuestionResponse;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.entity.Question;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import com.suho149.liveauction.domain.product.repository.QuestionRepository;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QnaService {
    private final QuestionRepository questionRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // 질문 목록 조회
    @Transactional(readOnly = true)
    public List<QuestionResponse> getQuestions(Long productId, UserPrincipal currentUserPrincipal) {
        User currentUser = (currentUserPrincipal != null) ?
                userRepository.findById(currentUserPrincipal.getId()).orElse(null) :
                null;

        List<Question> questions = questionRepository.findByProductIdWithDetails(productId);

        return questions.stream()
                .map(question -> new QuestionResponse(question, currentUser))
                .collect(Collectors.toList());
    }

    // 질문 작성
    @Transactional
    public void createQuestion(Long productId, QuestionRequest request, UserPrincipal authorPrincipal) {
        // --- 1. 작성자 조회 ---
        User author = userRepository.findById(authorPrincipal.getId())
                .orElseThrow(() -> new UsernameNotFoundException("질문 작성 실패: 인증된 사용자 정보를 찾을 수 없습니다. ID: " + authorPrincipal.getId()));

        // --- 2. 상품 조회 ---
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("질문 작성 실패: 상품을 찾을 수 없습니다. ID: " + productId));

        Question question = Question.builder()
                .product(product).author(author)
                .content(request.getContent())
                .isPrivate(request.isPrivate())
                .build();
        questionRepository.save(question);

        // 판매자에게 알림 발송
        String content = "'" + product.getName() + "' 상품에 새로운 문의가 등록되었습니다.";
        notificationService.send(product.getSeller(), NotificationType.CHAT, content, "/products/" + productId);
    }

    // 답변 작성
    @Transactional
    public void createAnswer(Long questionId, AnswerRequest request, UserPrincipal sellerPrincipal) {
        // --- 3. 질문 조회 ---
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("답변 작성 실패: 질문을 찾을 수 없습니다. ID: " + questionId));

        // 판매자 본인 확인
        if (!question.getProduct().getSeller().getId().equals(sellerPrincipal.getId())) {
            throw new IllegalStateException("답변을 작성할 권한이 없습니다.");
        }

        question.addAnswer(request.getAnswer());

        // 질문자에게 알림 발송
        String content = "문의하신 '" + question.getProduct().getName() + "' 상품에 답변이 등록되었습니다.";
        notificationService.send(question.getAuthor(), NotificationType.CHAT, content, "/products/" + question.getProduct().getId());
    }
}