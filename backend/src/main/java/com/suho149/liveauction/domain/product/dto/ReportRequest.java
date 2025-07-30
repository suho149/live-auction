package com.suho149.liveauction.domain.product.dto;

import com.suho149.liveauction.domain.product.entity.ReportReason;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReportRequest {
    private ReportReason reason;
    private String detail;
}
