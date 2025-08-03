package com.suho149.liveauction.domain.admin.dto;

import com.suho149.liveauction.domain.product.entity.Report;
import com.suho149.liveauction.domain.product.entity.ReportReason;
import com.suho149.liveauction.domain.product.entity.ReportStatus;
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
    private final ReportStatus status;
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
        this.status = report.getStatus();
        this.createdAt = report.getCreatedAt();
    }

    public ReportResponse(Long reportId, Long productId, String productName, Long reporterId, String reporterName,
                          Long sellerId, String sellerName, ReportReason reason, String detail,
                          ReportStatus status, LocalDateTime createdAt) {
        this.reportId = reportId;
        this.productId = productId;
        this.productName = productName;
        this.reporterId = reporterId;
        this.reporterName = reporterName;
        this.sellerId = sellerId;
        this.sellerName = sellerName;
        this.reason = reason;
        this.detail = detail;
        this.status = status;
        this.createdAt = createdAt;
    }
}
