package com.suho149.liveauction.domain.keyword.dto;

import com.suho149.liveauction.domain.keyword.entity.Keyword;
import lombok.Getter;

@Getter
public class KeywordResponse {
    private final Long id;
    private final String keyword;

    public KeywordResponse(Keyword keyword) {
        this.id = keyword.getId();
        this.keyword = keyword.getKeyword();
    }
}
