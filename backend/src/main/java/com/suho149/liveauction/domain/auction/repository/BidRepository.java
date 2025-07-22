package com.suho149.liveauction.domain.auction.repository;

import com.suho149.liveauction.domain.auction.entity.Bid;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.entity.ProductStatus;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BidRepository extends JpaRepository<Bid, Long> {

    // 특정 상품에 입찰한 고유한 사용자의 수를 계산
    @Query("SELECT COUNT(DISTINCT b.bidder.id) FROM Bid b WHERE b.product.id = :productId")
    long countDistinctBiddersByProductId(@Param("productId") Long productId);

    @Query("SELECT DISTINCT b.product FROM Bid b " +
            "WHERE b.bidder.id = :bidderId AND b.product.status = :status")
    List<Product> findBiddingProductsByBidderIdAndStatus(
            @Param("bidderId") Long bidderId,
            @Param("status") ProductStatus status
    );
}
