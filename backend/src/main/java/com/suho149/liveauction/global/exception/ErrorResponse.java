package com.suho149.liveauction.global.exception;

import lombok.Getter;

@Getter
public class ErrorResponse {
    private final String message;
    private final String code;

    public ErrorResponse(String code, String message) {
        this.code = code;
        this.message = message;
    }
}
