package com.suho149.liveauction.domain.auction.repository;

import com.suho149.liveauction.domain.auction.entity.Bid;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface BidRepository extends JpaRepository<Bid, Long> {

    // 특정 상품에 입찰한 고유한 사용자의 수를 계산
    @Query("SELECT COUNT(DISTINCT b.bidder.id) FROM Bid b WHERE b.product.id = :productId")
    long countDistinctBiddersByProductId(@Param("productId") Long productId);
}
