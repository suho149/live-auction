package com.suho149.liveauction.global.config;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public abstract class SimpleGrantedAuthorityMixin {

    // Jackson에게 이 생성자를 사용하여 객체를 만들라고 알려줌
    @JsonCreator
    public SimpleGrantedAuthorityMixin(
            // JSON에서 "authority" 라는 키를 찾아 이 파라미터에 주입하라고 알려줌
            @JsonProperty("authority") String role
    ) {
    }
}
