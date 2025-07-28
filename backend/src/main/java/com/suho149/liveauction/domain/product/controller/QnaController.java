package com.suho149.liveauction.domain.product.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.suho149.liveauction.domain.product.dto.AnswerRequest;
import com.suho149.liveauction.domain.product.dto.QuestionRequest;
import com.suho149.liveauction.domain.product.dto.QuestionResponse;
import com.suho149.liveauction.domain.product.service.QnaService;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/products/{productId}/qna")
@RequiredArgsConstructor
public class QnaController {
    private final QnaService qnaService;
    private final ObjectMapper objectMapper; // JSON 로깅을 위해 주입 (선택사항)


    @GetMapping
    public ResponseEntity<List<QuestionResponse>> getQuestions(@PathVariable Long productId, @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(qnaService.getQuestions(productId, currentUser));
    }

    @PostMapping
    public ResponseEntity<Void> createQuestion(@PathVariable Long productId, @RequestBody QuestionRequest request, @AuthenticationPrincipal UserPrincipal author) {
        qnaService.createQuestion(productId, request, author);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // 답변은 질문 ID로 하므로 경로를 다르게 설정
    @PostMapping("/{questionId}/answer")
    public ResponseEntity<Void> createAnswer(@PathVariable Long productId, @PathVariable Long questionId, @RequestBody AnswerRequest request, @AuthenticationPrincipal UserPrincipal seller) {
        qnaService.createAnswer(questionId, request, seller);
        return ResponseEntity.ok().build();
    }
}
