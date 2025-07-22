package com.suho149.liveauction.domain.user.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewRequest {
    private int rating;
    private String comment;
}
