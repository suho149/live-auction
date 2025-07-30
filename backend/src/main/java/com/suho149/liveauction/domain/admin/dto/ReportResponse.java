package com.suho149.liveauction.domain.admin.dto;

import com.suho149.liveauction.domain.product.entity.Report;
import com.suho149.liveauction.domain.product.entity.ReportReason;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ReportResponse {
    private final Long reportId;
    private final Long productId;
    private final String productName;
    private final Long reporterId;
    private final String reporterName;
    private final Long sellerId;
    private final String sellerName;
    private final ReportReason reason;
    private final String detail;
    private final LocalDateTime createdAt;

    public ReportResponse(Report report) {
        this.reportId = report.getId();
        this.productId = report.getProduct().getId();
        this.productName = report.getProduct().getName();
        this.reporterId = report.getReporter().getId();
        this.reporterName = report.getReporter().getName();
        this.sellerId = report.getProduct().getSeller().getId();
        this.sellerName = report.getProduct().getSeller().getName();
        this.reason = report.getReason();
        this.detail = report.getDetail();
        this.createdAt = report.getCreatedAt();
    }
}
