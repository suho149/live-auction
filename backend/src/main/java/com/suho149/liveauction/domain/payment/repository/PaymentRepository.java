package com.suho149.liveauction.domain.payment.repository;

import com.suho149.liveauction.domain.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderId(String orderId);

    Optional<Payment> findByProductId(Long productId);
}
