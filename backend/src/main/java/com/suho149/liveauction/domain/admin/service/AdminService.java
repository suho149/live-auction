package com.suho149.liveauction.domain.admin.service;

import com.suho149.liveauction.domain.admin.dto.SettlementResponse;
import com.suho149.liveauction.domain.notification.entity.NotificationType;
import com.suho149.liveauction.domain.notification.service.NotificationService;
import com.suho149.liveauction.domain.user.entity.Settlement;
import com.suho149.liveauction.domain.user.entity.SettlementStatus;
import com.suho149.liveauction.domain.user.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {
    private final SettlementRepository settlementRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<SettlementResponse> getPendingSettlements() {
        return settlementRepository.findByStatus(SettlementStatus.REQUESTED)
                .stream()
                .map(SettlementResponse::new)
                .collect(Collectors.toList());
    }

    public void completeSettlement(Long settlementId) {
        // ★★★ orElseThrow 완성 ★★★
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 정산 요청입니다. ID: " + settlementId));

        if (settlement.getStatus() != SettlementStatus.REQUESTED) {
            throw new IllegalStateException("이미 처리되었거나 처리할 수 없는 정산 요청입니다.");
        }

        settlement.complete();

        // 판매자의 pending 금액을 차감하는 로직은 User 엔티티에 추가 필요
        // User seller = settlement.getSeller();
        // seller.completeSettlement(settlement.getAmount());

        String formattedAmount = String.format("%,d", settlement.getAmount());
        // 또는 NumberFormat 사용:
        // String formattedAmount = NumberFormat.getInstance(Locale.KOREA).format(settlement.getAmount());

        String content = "요청하신 " + formattedAmount + "원의 정산이 완료되었습니다.";

        notificationService.send(
                settlement.getSeller(),
                NotificationType.DELIVERY, // 또는 NotificationType.SETTLEMENT 등을 새로 만들어도 좋음
                content,
                "/mypage?tab=settlement"
        );
    }
}
