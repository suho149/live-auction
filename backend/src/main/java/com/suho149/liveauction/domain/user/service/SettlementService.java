package com.suho149.liveauction.domain.user.service;

import com.suho149.liveauction.domain.payment.entity.Payment;
import com.suho149.liveauction.domain.product.entity.ProductStatus;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import com.suho149.liveauction.domain.user.dto.SettlementHistoryResponse;
import com.suho149.liveauction.domain.user.dto.SettlementSummaryResponse;
import com.suho149.liveauction.domain.user.entity.Settlement;
import com.suho149.liveauction.domain.user.entity.SettlementStatus;
import com.suho149.liveauction.domain.user.repository.SettlementRepository;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SettlementService {

    // ProductRepository와 UserRepository는 이제 필요 없습니다.
    private final SettlementRepository settlementRepository;

    /**
     * 구매 확정 시 호출되어, '정산 가능' 상태의 Settlement를 생성합니다.
     * DeliveryService에서 호출됩니다.
     */
    @Transactional
    public void createSettlement(Payment payment) {
        // 이미 해당 결제에 대한 정산이 생성되었는지 확인 (멱등성 보장)
        if (settlementRepository.existsByPaymentId(payment.getId())) {
            log.warn("이미 정산이 생성된 결제 건입니다. 중복 생성을 방지합니다. Payment ID: {}", payment.getId());
            return;
        }

        // TODO: 수수료 정책이 있다면 여기서 금액을 계산합니다.
        // long commission = (long) (payment.getAmount() * 0.05); // 예: 5% 수수료
        // long finalAmount = payment.getAmount() - commission;

        Settlement settlement = Settlement.builder()
                .seller(payment.getProduct().getSeller())
                .payment(payment)
                .amount(payment.getAmount()) // 지금은 수수료 없이 전체 금액
                .build();
        settlementRepository.save(settlement);
        log.info("새로운 정산 건 생성 완료. Seller ID: {}, Payment ID: {}, Amount: {}",
                settlement.getSeller().getId(), payment.getId(), settlement.getAmount());
    }

    /**
     * 정산 요약 정보를 조회합니다. User 엔티티 대신 Settlement 테이블을 직접 계산합니다.
     */
    @Transactional(readOnly = true)
    public SettlementSummaryResponse getSettlementSummary(UserPrincipal userPrincipal) {
        Long sellerId = userPrincipal.getId();

        // 각 상태별 금액 합계를 Repository에서 직접 계산 (쿼리 최적화)
        long availableAmount = settlementRepository.sumAmountBySellerIdAndStatus(sellerId, SettlementStatus.AVAILABLE).orElse(0L);
        long requestedAmount = settlementRepository.sumAmountBySellerIdAndStatus(sellerId, SettlementStatus.REQUESTED).orElse(0L);
        long completedAmount = settlementRepository.sumAmountBySellerIdAndStatus(sellerId, SettlementStatus.COMPLETED).orElse(0L);

        long totalSalesAmount = availableAmount + requestedAmount + completedAmount;

        return new SettlementSummaryResponse(totalSalesAmount, completedAmount, requestedAmount, availableAmount);
    }

    /**
     * '정산 가능' 상태의 모든 정산 건에 대해 일괄적으로 정산 요청을 합니다.
     */
    @Transactional
    public void requestSettlement(UserPrincipal userPrincipal) {
        // 1. 정산 가능한 모든 Settlement 건을 조회
        List<Settlement> availableSettlements = settlementRepository.findBySellerIdAndStatus(
                userPrincipal.getId(), SettlementStatus.AVAILABLE
        );

        if (availableSettlements.isEmpty()) {
            throw new IllegalStateException("정산 요청할 금액이 없습니다.");
        }

        // 2. 각 Settlement의 상태를 'REQUESTED'로 변경
        availableSettlements.forEach(Settlement::request);

        log.info("사용자 ID {}의 정산 요청 처리 완료. 대상 건수: {}", userPrincipal.getId(), availableSettlements.size());
        // 실제라면, 관리자에게 알림을 보내는 로직 등이 추가될 수 있습니다.
    }

    /**
     * 정산 내역을 조회합니다.
     */
    @Transactional(readOnly = true)
    public List<SettlementHistoryResponse> getSettlementHistory(UserPrincipal userPrincipal) {
        return settlementRepository.findBySellerIdOrderByRequestedAtDesc(userPrincipal.getId())
                .stream()
                .map(SettlementHistoryResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 관리자가 정산 처리를 완료할 때 호출됩니다.
     */
    @Transactional
    public void completeSettlement(Long settlementId) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 정산 요청입니다. ID: " + settlementId));

        settlement.complete(); // 상태를 'COMPLETED'로 변경

        // TODO: 판매자에게 '정산이 완료되었습니다' 알림 발송 (NotificationService 사용)
        log.info("정산 ID {} 처리 완료.", settlementId);
    }
}