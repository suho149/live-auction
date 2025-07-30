package com.suho149.liveauction.domain.user.repository;

import com.suho149.liveauction.domain.user.entity.Settlement;
import com.suho149.liveauction.domain.user.entity.SettlementStatus;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    /**
     * 특정 판매자의 모든 정산 내역을 요청 시간(requestedAt) 기준 내림차순으로 조회합니다.
     * 'AVAILABLE' 상태는 requestedAt이 null이므로, id를 기준으로 정렬되도록 합니다.
     * @param sellerId 판매자의 ID
     * @return Settlement 목록
     */
    @Query("SELECT s FROM Settlement s WHERE s.seller.id = :sellerId ORDER BY s.requestedAt DESC NULLS LAST, s.id DESC")
    List<Settlement> findBySellerIdOrderByRequestedAtDesc(@Param("sellerId") Long sellerId);

    /**
     * 특정 결제(Payment) ID에 해당하는 정산(Settlement) 데이터가 존재하는지 확인합니다.
     * @param paymentId 결제의 ID
     * @return 존재하면 true, 아니면 false
     */
    boolean existsByPaymentId(Long paymentId);

    /**
     * 특정 판매자의 특정 상태에 해당하는 모든 정산 건들의 금액 합계를 계산합니다.
     * 결과가 없을 경우 null을 반환할 수 있으므로 Optional<Long>을 사용합니다.
     * @param sellerId 판매자의 ID
     * @param status 조회할 정산 상태
     * @return 금액의 합계 (Optional)
     */
    @Query("SELECT SUM(s.amount) FROM Settlement s WHERE s.seller.id = :sellerId AND s.status = :status")
    Optional<Long> sumAmountBySellerIdAndStatus(@Param("sellerId") Long sellerId, @Param("status") SettlementStatus status);

    /**
     * 특정 판매자의 특정 상태에 해당하는 모든 정산(Settlement) 목록을 조회합니다.
     * @param sellerId 판매자의 ID
     * @param status 조회할 정산 상태
     * @return Settlement 목록
     */
    List<Settlement> findBySellerIdAndStatus(Long sellerId, SettlementStatus status);

    /**
     * 특정 상태를 가진 모든 정산 내역을 조회합니다. (관리자용)
     * @param status 조회할 정산 상태
     * @return Settlement 목록
     */
    List<Settlement> findByStatus(SettlementStatus status);

    // 특정 상태의 정산 요청 건수
    long countByStatus(SettlementStatus status);
}
