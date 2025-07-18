package com.suho149.liveauction.domain.keyword.controller;

import com.suho149.liveauction.domain.keyword.dto.KeywordRequest;
import com.suho149.liveauction.domain.keyword.dto.KeywordResponse;
import com.suho149.liveauction.domain.keyword.service.KeywordService;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/keywords")
@RequiredArgsConstructor
public class KeywordController {

    private final KeywordService keywordService;

    @PostMapping
    public ResponseEntity<KeywordResponse> addKeyword(@RequestBody KeywordRequest request, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(keywordService.addKeyword(request, userPrincipal));
    }

    @GetMapping
    public ResponseEntity<List<KeywordResponse>> getMyKeywords(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(keywordService.getMyKeywords(userPrincipal));
    }

    @DeleteMapping("/{keywordId}")
    public ResponseEntity<Void> deleteKeyword(@PathVariable Long keywordId, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        keywordService.deleteKeyword(keywordId, userPrincipal);
        return ResponseEntity.noContent().build();
    }
}
