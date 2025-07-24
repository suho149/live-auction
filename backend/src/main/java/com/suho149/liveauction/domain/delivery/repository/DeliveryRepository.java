package com.suho149.liveauction.domain.delivery.repository;

import com.suho149.liveauction.domain.delivery.entity.Delivery;
import com.suho149.liveauction.domain.delivery.entity.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    // 스케줄러가 '배송 준비 중' 상태의 모든 배송 건을 조회하기 위한 메소드
    List<Delivery> findByStatus(DeliveryStatus status);


    /**
     * 운송장 번호로 배송 정보를 조회합니다.
     * 운송장 번호는 고유해야 하므로 Optional을 반환합니다.
     * @param trackingNumber 조회할 운송장 번호
     * @return Optional<Delivery>
     */
    Optional<Delivery> findByTrackingNumber(String trackingNumber);
}
