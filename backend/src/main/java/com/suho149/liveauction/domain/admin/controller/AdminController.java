package com.suho149.liveauction.domain.admin.controller;

import com.suho149.liveauction.domain.admin.dto.SettlementResponse;
import com.suho149.liveauction.domain.admin.dto.UserSummaryResponse;
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
    public ResponseEntity<Page<UserSummaryResponse>> getAllUsers(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllUsers(pageable));
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
    public ResponseEntity<Page<ProductResponse>> getAllProducts(
            @ModelAttribute ProductSearchCondition condition,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.getAllProducts(condition, pageable));
    }
}
