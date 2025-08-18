package com.suho149.liveauction.domain.delivery.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ShipRequest {
    private String carrierId; // 택배사 코드 (예: "04")
    private String carrierName; // 택배사 이름 (예: "CJ대한통운")
    private String trackingNumber;
}
