package com.suho149.liveauction.domain.product.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuestionRequest {
    private String content;
    private boolean isPrivate;
}
