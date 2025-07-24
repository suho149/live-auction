package com.suho149.liveauction.domain.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class TrackingInfo {
    private String trackingNumber;
    private String senderName;
    private String recipientName;
    private String productName;
    private List<TrackingDetail> history;

    @Getter
    @AllArgsConstructor
    public static class TrackingDetail {
        private LocalDateTime time;
        private String location;
        private String status;
        private String description;
    }
}
