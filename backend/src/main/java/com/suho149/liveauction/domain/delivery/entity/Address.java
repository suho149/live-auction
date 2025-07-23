package com.suho149.liveauction.domain.delivery.entity;

import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Address {
    private String recipientName; // 수령인
    private String recipientPhone; // 연락처
    private String postalCode; // 우편번호
    private String mainAddress; // 기본 주소
    private String detailAddress; // 상세 주소
}
