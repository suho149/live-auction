package com.suho149.liveauction.domain.admin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProcessReportRequest {
    @JsonProperty("isAccepted")
    private boolean isAccepted;
}
