package com.suho149.liveauction.domain.user.controller;

import com.suho149.liveauction.domain.product.dto.ProductResponse;
import com.suho149.liveauction.domain.user.dto.*;
import com.suho149.liveauction.domain.user.service.SettlementService;
import com.suho149.liveauction.domain.user.service.UserService;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final SettlementService settlementService;

    /**
     * 현재 인증된 사용자의 정보를 반환합니다.
     * @param userPrincipal @AuthenticationPrincipal을 통해 주입된 사용자 정보
     * @return ResponseEntity<UserResponse>
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyInfo(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserResponse myInfo = userService.getMyInfo(userPrincipal);
        return ResponseEntity.ok(myInfo);
    }

    @GetMapping("/me/purchases")
    public ResponseEntity<List<PurchaseHistoryResponse>> getMyPurchaseHistory(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<PurchaseHistoryResponse> history = userService.getMyPurchaseHistory(userPrincipal);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/me/sales")
    public ResponseEntity<List<SaleHistoryResponse>> getMySaleHistory(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<SaleHistoryResponse> history = userService.getMySaleHistory(userPrincipal);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/me/settlement-summary")
    public ResponseEntity<SettlementSummaryResponse> getSettlementSummary(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(settlementService.getSettlementSummary(userPrincipal));
    }

    @PostMapping("/me/settlement-request")
    public ResponseEntity<Void> requestSettlement(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        settlementService.requestSettlement(userPrincipal);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me/settlement-history")
    public ResponseEntity<List<SettlementHistoryResponse>> getSettlementHistory(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(settlementService.getSettlementHistory(userPrincipal));
    }

    @GetMapping("/me/bidding")
    public ResponseEntity<List<ProductResponse>> getMyBiddingProducts(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(userService.getMyBiddingProducts(userPrincipal));
    }

    @GetMapping("/me/selling")
    public ResponseEntity<List<ProductResponse>> getMySellingProducts(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(userService.getMySellingProducts(userPrincipal));
    }
}
