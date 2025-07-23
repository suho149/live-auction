package com.suho149.liveauction.domain.delivery.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeliveryInfoRequest {
    private String recipientName;
    private String recipientPhone;
    private String postalCode;
    private String mainAddress;
    private String detailAddress;
}
