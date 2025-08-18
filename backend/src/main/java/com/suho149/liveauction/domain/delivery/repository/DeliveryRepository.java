package com.suho149.liveauction.domain.delivery.repository;

import com.suho149.liveauction.domain.delivery.entity.Delivery;
import com.suho149.liveauction.domain.delivery.entity.DeliveryStatus;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
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

    /**
     * 특정 상태이고, 배송 완료 시간이 주어진 시간 이전인 배송 목록을 조회합니다.
     */
    List<Delivery> findByStatusAndCompletedAtBefore(DeliveryStatus status, LocalDateTime dateTime);

    @Query("SELECT d FROM Delivery d " +
            "JOIN FETCH d.payment p " +
            "JOIN FETCH p.product prod " +
            "JOIN FETCH prod.seller " +
            "JOIN FETCH p.buyer " +
            "WHERE d.trackingNumber = :trackingNumber")
    Optional<Delivery> findWithDetailsByTrackingNumber(@Param("trackingNumber") String trackingNumber);
}
