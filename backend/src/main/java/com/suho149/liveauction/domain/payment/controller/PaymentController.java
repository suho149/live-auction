package com.suho149.liveauction.domain.payment.controller;

import com.suho149.liveauction.domain.payment.dto.PaymentInfoResponse;
import com.suho149.liveauction.domain.payment.dto.PaymentRequest;
import com.suho149.liveauction.domain.payment.dto.PaymentSuccessResponse;
import com.suho149.liveauction.domain.payment.service.PaymentService;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;

    @PostMapping("/{productId}/info")
    public ResponseEntity<PaymentInfoResponse> createPaymentInfo(@PathVariable Long productId, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(paymentService.createPaymentInfo(productId, userPrincipal));
    }

    @PostMapping("/confirm")
    public ResponseEntity<PaymentSuccessResponse> confirmPayment(@RequestBody PaymentRequest request, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PaymentSuccessResponse response = paymentService.confirmPayment(request, userPrincipal);
        return ResponseEntity.ok(response);
    }
}
