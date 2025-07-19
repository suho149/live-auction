package com.suho149.liveauction.domain.payment.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentInfoResponse {
    private String orderId;
    private String productName;
    private Long amount;
    private String buyerName;
    private String buyerEmail;
}
