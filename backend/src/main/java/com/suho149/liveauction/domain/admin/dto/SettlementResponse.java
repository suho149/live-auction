package com.suho149.liveauction.domain.admin.dto;

import com.suho149.liveauction.domain.user.entity.Settlement;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class SettlementResponse {
    private final Long settlementId;
    private final String sellerName;
    private final Long amount;
    private final LocalDateTime requestedAt;

    public SettlementResponse(Settlement settlement) {
        this.settlementId = settlement.getId();
        this.sellerName = settlement.getSeller().getName();
        this.amount = settlement.getAmount();
        this.requestedAt = settlement.getRequestedAt();
    }
}
