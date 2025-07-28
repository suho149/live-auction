package com.suho149.liveauction.domain.admin.controller;

import com.suho149.liveauction.domain.admin.dto.SettlementResponse;
import com.suho149.liveauction.domain.admin.service.AdminService;
import lombok.RequiredArgsConstructor;
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
}
