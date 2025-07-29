package com.suho149.liveauction.domain.admin.service;

import com.suho149.liveauction.domain.admin.dto.SettlementResponse;
import com.suho149.liveauction.domain.admin.dto.UserSummaryResponse;
import com.suho149.liveauction.domain.notification.entity.NotificationType;
import com.suho149.liveauction.domain.notification.service.NotificationService;
import com.suho149.liveauction.domain.product.dto.ProductResponse;
import com.suho149.liveauction.domain.product.dto.ProductSearchCondition;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import com.suho149.liveauction.domain.user.entity.Role;
import com.suho149.liveauction.domain.user.entity.Settlement;
import com.suho149.liveauction.domain.user.entity.SettlementStatus;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.SettlementRepository;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AdminService {
    private final SettlementRepository settlementRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<SettlementResponse> getPendingSettlements() {
        return settlementRepository.findByStatus(SettlementStatus.REQUESTED)
                .stream()
                .map(SettlementResponse::new)
                .collect(Collectors.toList());
    }

    public void completeSettlement(Long settlementId) {
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

    // 모든 사용자 목록 페이징 조회
    @Transactional(readOnly = true)
    public Page<UserSummaryResponse> getAllUsers(String name, String email, Pageable pageable) {
        Page<User> userPage = userRepository.searchUsers(name, email, pageable);
        return userPage.map(UserSummaryResponse::from);
    }

    // 부적절한 상품 강제 삭제
    public void forceDeleteProduct(Long productId) {
        // 연관된 데이터(입찰, Q&A 등)가 CascadeType.REMOVE로 설정되어 있는지 확인 필요
        productRepository.deleteById(productId);
        log.info("관리자에 의해 상품 ID {}가 강제 삭제되었습니다.", productId);
    }

    @Transactional
    public void grantAdminRole(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.updateRole(Role.ADMIN);
    }

    @Transactional
    public void revokeAdminRole(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        // 본인 계정의 권한을 해제하는 것을 방지하는 로직을 추가하면 더 안전합니다.
        user.updateRole(Role.USER);
    }

    // 관리자용 상품 목록 조회 메소드 추가
    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(ProductSearchCondition condition, Pageable pageable) {
        // 관리자는 기본적으로 모든 상태의 상품을 조회.
        // 만약 condition에 특정 status가 있으면 그것을 따름.
        // 이 로직은 ProductService와 동일하게 유지하거나, 관리자 특화 로직을 추가할 수 있음.
        return productRepository.search(condition, pageable)
                .map(ProductResponse::from);
    }
}
