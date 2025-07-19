package com.suho149.liveauction.domain.payment.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentRequest {
    private String paymentKey;
    private String orderId;
    private Long amount;
}
