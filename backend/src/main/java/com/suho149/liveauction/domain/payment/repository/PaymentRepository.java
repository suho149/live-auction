package com.suho149.liveauction.domain.payment.repository;

import com.suho149.liveauction.domain.payment.entity.Payment;
import com.suho149.liveauction.domain.payment.entity.PaymentStatus;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT p FROM Payment p JOIN FETCH p.product WHERE p.orderId = :orderId")
    Optional<Payment> findByOrderId(@Param("orderId") String orderId); // 메소드 이름은 그대로 두고 @Query 추가

    Optional<Payment> findByProductId(Long productId);

    @Query("SELECT p FROM Payment p " +
            "JOIN FETCH p.product prod " +
            "LEFT JOIN FETCH prod.images " +
            "WHERE p.buyer.id = :buyerId AND p.status = 'COMPLETED' " +
            "ORDER BY p.paidAt DESC")
    List<Payment> findCompletedPaymentsByBuyerId(@Param("buyerId") Long buyerId);

    /**
     * 특정 상품 ID와 결제 상태로 Payment를 조회합니다.
     * @param productId 상품의 ID
     * @param status 조회할 결제 상태
     * @return Optional<Payment>
     */
    Optional<Payment> findByProductIdAndStatus(Long productId, PaymentStatus status);
}
