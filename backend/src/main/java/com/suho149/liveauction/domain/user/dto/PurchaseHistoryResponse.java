package com.suho149.liveauction.domain.user.dto;

import com.suho149.liveauction.domain.payment.entity.Payment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PurchaseHistoryResponse {
    private final Long productId;
    private final String productName;
    private final String productThumbnailUrl;
    private final Long finalPrice;
    private final LocalDateTime purchasedAt;
    private final boolean reviewWritten;

    public static PurchaseHistoryResponse from(Payment payment, boolean reviewWritten) {
        return PurchaseHistoryResponse.builder()
                .productId(payment.getProduct().getId())
                .productName(payment.getProduct().getName())
                .productThumbnailUrl(
                        payment.getProduct().getImages().isEmpty() ?
                                null : payment.getProduct().getImages().get(0).getImageUrl()
                )
                .finalPrice(payment.getAmount())
                .purchasedAt(payment.getPaidAt())
                .reviewWritten(reviewWritten)
                .build();
    }
}
