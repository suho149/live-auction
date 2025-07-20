package com.suho149.liveauction.domain.payment.repository;

import com.suho149.liveauction.domain.payment.entity.Payment;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT p FROM Payment p JOIN FETCH p.product WHERE p.orderId = :orderId")
    Optional<Payment> findByOrderId(@Param("orderId") String orderId); // 메소드 이름은 그대로 두고 @Query 추가

    Optional<Payment> findByProductId(Long productId);
}
