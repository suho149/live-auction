package com.suho149.liveauction.domain.user.dto;

import com.suho149.liveauction.domain.user.entity.Settlement;
import com.suho149.liveauction.domain.user.entity.SettlementStatus;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class SettlementHistoryResponse {
    private final Long id;
    private final Long amount;
    private final SettlementStatus status;
    private final LocalDateTime requestedAt;
    private final LocalDateTime completedAt;

    public SettlementHistoryResponse(Settlement settlement) {
        this.id = settlement.getId();
        this.amount = settlement.getAmount();
        this.status = settlement.getStatus();
        this.requestedAt = settlement.getRequestedAt();
        this.completedAt = settlement.getCompletedAt();
    }
}
