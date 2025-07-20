package com.suho149.liveauction.domain.user.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettlementService {
    private final ProductRepository productRepository;
    private final SettlementRepository settlementRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public SettlementSummaryResponse getSettlementSummary(UserPrincipal userPrincipal) {
        Long sellerId = userPrincipal.getId();

        // 1. 총 판매 금액 계산
        long totalSalesAmount = productRepository.findProductsBySellerIdAndStatus(sellerId, ProductStatus.SOLD_OUT)
                .stream()
                .mapToLong(product -> product.getCurrentPrice())
                .sum();

        // 2. 기정산 금액 및 정산 요청 중인 금액 계산
        List<Settlement> settlements = settlementRepository.findBySellerIdOrderByRequestedAtDesc(sellerId);
        long totalSettledAmount = settlements.stream()
                .filter(s -> s.getStatus() == SettlementStatus.COMPLETED)
                .mapToLong(Settlement::getAmount)
                .sum();
        long pendingSettlementAmount = settlements.stream()
                .filter(s -> s.getStatus() == SettlementStatus.PENDING)
                .mapToLong(Settlement::getAmount)
                .sum();

        // 3. 정산 가능 금액 계산
        long availableSettlementAmount = totalSalesAmount - totalSettledAmount - pendingSettlementAmount;

        return new SettlementSummaryResponse(totalSalesAmount, totalSettledAmount, pendingSettlementAmount, availableSettlementAmount);
    }

    @Transactional
    public void requestSettlement(UserPrincipal userPrincipal) {
        SettlementSummaryResponse summary = getSettlementSummary(userPrincipal);
        long amountToSettle = summary.getAvailableSettlementAmount();

        if (amountToSettle <= 0) {
            throw new IllegalStateException("정산할 금액이 없습니다.");
        }

        Settlement newSettlement = Settlement.builder()
                .seller(userRepository.getReferenceById(userPrincipal.getId()))
                .amount(amountToSettle)
                .build();

        settlementRepository.save(newSettlement);

        // 실제라면, 관리자에게 알림을 보내는 로직 등이 추가될 수 있습니다.
    }

    @Transactional(readOnly = true)
    public List<SettlementHistoryResponse> getSettlementHistory(UserPrincipal userPrincipal) {
        return settlementRepository.findBySellerIdOrderByRequestedAtDesc(userPrincipal.getId())
                .stream()
                .map(SettlementHistoryResponse::new)
                .collect(Collectors.toList());
    }
}
