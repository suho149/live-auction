package com.suho149.liveauction.domain.delivery.repository;

import com.suho149.liveauction.domain.delivery.entity.Delivery;
import com.suho149.liveauction.domain.delivery.entity.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    // 스케줄러가 '배송 준비 중' 상태의 모든 배송 건을 조회하기 위한 메소드
    List<Delivery> findByStatus(DeliveryStatus status);
}
