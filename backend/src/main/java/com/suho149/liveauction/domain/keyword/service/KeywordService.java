package com.suho149.liveauction.domain.keyword.service;

import com.suho149.liveauction.domain.keyword.dto.KeywordRequest;
import com.suho149.liveauction.domain.keyword.dto.KeywordResponse;
import com.suho149.liveauction.domain.keyword.entity.Keyword;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.keyword.repository.KeywordRepository;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KeywordService {
    private final KeywordRepository keywordRepository;
    private final UserRepository userRepository;

    @Transactional
    public KeywordResponse addKeyword(KeywordRequest request, UserPrincipal userPrincipal) {
        User user = userRepository.getReferenceById(userPrincipal.getId());
        Keyword newKeyword = Keyword.builder()
                .user(user)
                .keyword(request.getKeyword())
                .build();
        keywordRepository.save(newKeyword);
        return new KeywordResponse(newKeyword);
    }

    @Transactional(readOnly = true)
    public List<KeywordResponse> getMyKeywords(UserPrincipal userPrincipal) {
        List<Keyword> keywords = keywordRepository.findByUserId(userPrincipal.getId());
        return keywords.stream().map(KeywordResponse::new).collect(Collectors.toList());
    }

    @Transactional
    public void deleteKeyword(Long keywordId, UserPrincipal userPrincipal) {
        Keyword keyword = keywordRepository.findById(keywordId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 키워드입니다."));

        // 본인의 키워드인지 확인
        if (!keyword.getUser().getId().equals(userPrincipal.getId())) {
            throw new IllegalStateException("삭제 권한이 없는 키워드입니다.");
        }

        keywordRepository.delete(keyword);
    }
}
