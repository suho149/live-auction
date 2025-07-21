package com.suho149.liveauction.domain.auction.repository;

import com.suho149.liveauction.domain.auction.entity.AutoBid;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AutoBidRepository extends JpaRepository<AutoBid, Long> {

    Optional<AutoBid> findByUser_IdAndProduct_Id(Long userId, Long productId);

    // 특정 상품에 설정된 모든 자동 입찰을 최대 금액이 높은 순으로 조회
    List<AutoBid> findByProduct_IdOrderByMaxAmountDesc(Long productId);
}
