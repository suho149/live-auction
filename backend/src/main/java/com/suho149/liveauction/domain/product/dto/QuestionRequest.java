package com.suho149.liveauction.domain.product.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuestionRequest {
    private String content;
    @JsonProperty("isPrivate")
    private boolean isPrivate;
}
