package com.suho149.liveauction.domain.admin.controller;

import com.suho149.liveauction.domain.admin.dto.*;
import com.suho149.liveauction.domain.admin.service.AdminService;
import com.suho149.liveauction.domain.product.dto.ProductResponse;
import com.suho149.liveauction.domain.product.dto.ProductSearchCondition;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;

    @GetMapping("/settlements/pending")
    public ResponseEntity<List<SettlementResponse>> getPendingSettlements() {
        return ResponseEntity.ok(adminService.getPendingSettlements());
    }

    @PostMapping("/settlements/{settlementId}/complete")
    public ResponseEntity<Void> completeSettlement(@PathVariable Long settlementId) {
        adminService.completeSettlement(settlementId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UserSummaryResponse>> getAllUsers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllUsers(name, email, pageable));
    }

    @DeleteMapping("/products/{productId}")
    public ResponseEntity<Void> forceDeleteProduct(@PathVariable Long productId) {
        adminService.forceDeleteProduct(productId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{userId}/grant-admin")
    public ResponseEntity<Void> grantAdminRole(@PathVariable Long userId) {
        adminService.grantAdminRole(userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/{userId}/revoke-admin")
    public ResponseEntity<Void> revokeAdminRole(@PathVariable Long userId) {
        adminService.revokeAdminRole(userId);
        return ResponseEntity.ok().build();
    }

    // 상품 목록 조회 엔드포인트 추가
    @GetMapping("/products")
    public ResponseEntity<Page<ProductSummaryResponse>> getAllProducts(
            // @RequestParam으로 개별 파라미터를 받음
            @RequestParam(required = false) String productName,
            @RequestParam(required = false) String sellerName,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.getAllProducts(productName, sellerName, pageable));
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary() {
        return ResponseEntity.ok(adminService.getDashboardSummary());
    }

    @GetMapping("/dashboard/daily-signups")
    public ResponseEntity<List<DailyStatsDto>> getDailyUserSignups() {
        return ResponseEntity.ok(adminService.getDailyUserSignups());
    }

    @GetMapping("/dashboard/daily-sales")
    public ResponseEntity<List<DailyStatsDto>> getDailySales() {
        return ResponseEntity.ok(adminService.getDailySales());
    }

    /**
     * 처리 대기 중인 모든 신고 목록을 조회합니다.
     */
    @GetMapping("/reports/pending")
    public ResponseEntity<List<ReportResponse>> getPendingReports() {
        return ResponseEntity.ok(adminService.getPendingReports());
    }

    /**
     * 특정 신고 건을 처리합니다 (승인/기각).
     */
    @PostMapping("/reports/{reportId}/process")
    public ResponseEntity<Void> processReport(
            @PathVariable Long reportId,
            @RequestBody ProcessReportRequest request // 요청 본문을 받을 DTO
    ) {
        adminService.processReport(reportId, request.isAccepted());
        return ResponseEntity.ok().build();
    }
}
