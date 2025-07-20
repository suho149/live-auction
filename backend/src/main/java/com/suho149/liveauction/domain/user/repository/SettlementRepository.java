package com.suho149.liveauction.domain.user.repository;

import com.suho149.liveauction.domain.user.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {
    List<Settlement> findBySellerIdOrderByRequestedAtDesc(Long sellerId);
}
