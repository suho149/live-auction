package com.suho149.liveauction.domain.payment.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentSuccessResponse {
    private String productName;
    private Long amount;
    private String orderId;
}
