package com.suho149.liveauction.domain.admin.service;

import com.suho149.liveauction.domain.admin.dto.*;
import com.suho149.liveauction.domain.notification.entity.NotificationType;
import com.suho149.liveauction.domain.notification.service.NotificationService;
import com.suho149.liveauction.domain.payment.repository.PaymentRepository;
import com.suho149.liveauction.domain.product.dto.ProductResponse;
import com.suho149.liveauction.domain.product.dto.ProductSearchCondition;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.entity.ProductStatus;
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

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private final PaymentRepository paymentRepository;

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
    public Page<ProductSummaryResponse> getAllProducts(String productName, String sellerName, Pageable pageable) {
        // 1. 검색 조건을 ProductSearchCondition DTO에 담습니다.
        ProductSearchCondition condition = new ProductSearchCondition();
        condition.setKeyword(productName);
        condition.setSellerName(sellerName);

        // 2. productRepository.search()를 호출합니다.
        Page<Product> productPage = productRepository.search(condition, pageable);

        // 3. Page<Product>를 Page<ProductSummaryResponse>로 변환하여 반환합니다.
        return productPage.map(ProductSummaryResponse::from);
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay(); // 오늘 0시 0분

        // 각 Repository에서 데이터 집계
        long totalUsers = userRepository.count();
        long newUsersToday = userRepository.countByCreatedAtAfter(todayStart);

        long totalProducts = productRepository.count();
        long onSaleProducts = productRepository.countByStatus(ProductStatus.ON_SALE);

        long totalSalesAmount = paymentRepository.sumTotalCompletedAmount();
        long salesAmountToday = paymentRepository.sumCompletedAmountAfter(todayStart);

        long pendingSettlementsCount = settlementRepository.countByStatus(SettlementStatus.REQUESTED);

        // DTO로 조립하여 반환
        return DashboardSummaryResponse.builder()
                .totalUsers(totalUsers)
                .newUsersToday(newUsersToday)
                .totalProducts(totalProducts)
                .onSaleProducts(onSaleProducts)
                .totalSalesAmount(totalSalesAmount)
                .salesAmountToday(salesAmountToday)
                .pendingSettlementsCount(pendingSettlementsCount)
                .build();
    }

    @Transactional(readOnly = true)
    public List<DailyStatsDto> getDailyUserSignups() {
        LocalDateTime oneWeekAgo = LocalDate.now().minusDays(6).atStartOfDay();
        List<Object[]> results = userRepository.findDailyUserSignups(oneWeekAgo);

        return results.stream()
                .map(row -> new DailyStatsDto(
                        ((Date) row[0]).toLocalDate(), // java.sql.Date -> LocalDate
                        ((Number) row[1]).longValue()      // BigInteger or Long -> long
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DailyStatsDto> getDailySales() {
        LocalDateTime oneWeekAgo = LocalDate.now().minusDays(6).atStartOfDay();
        List<Object[]> results = paymentRepository.findDailySales(oneWeekAgo);

        return results.stream()
                .map(row -> new DailyStatsDto(
                        ((Date) row[0]).toLocalDate(),
                        row[1] != null ? ((Number) row[1]).longValue() : 0L // SUM 결과는 null일 수 있음
                ))
                .collect(Collectors.toList());
    }
}
