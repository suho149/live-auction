package com.suho149.liveauction.domain.admin.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DashboardSummaryResponse {
    // 사용자 관련 지표
    private final long totalUsers;
    private final long newUsersToday;

    // 상품 관련 지표
    private final long totalProducts;
    private final long onSaleProducts;

    // 거래 관련 지표
    private final long totalSalesAmount;
    private final long salesAmountToday;

    // 정산 관련 지표
    private final long pendingSettlementsCount;
}
