package com.suho149.liveauction.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SettlementSummaryResponse {
    private final long totalSalesAmount; // 총 판매 금액
    private final long totalSettledAmount; // 기정산 금액
    private final long pendingSettlementAmount; // 정산 요청 중인 금액
    private final long availableSettlementAmount; // 정산 가능 금액
}
