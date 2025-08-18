package com.suho149.liveauction.domain.delivery.controller;

import com.suho149.liveauction.domain.delivery.dto.DeliveryInfoRequest;
import com.suho149.liveauction.domain.delivery.dto.ShipRequest;
import com.suho149.liveauction.domain.delivery.dto.TrackingInfo;
import com.suho149.liveauction.domain.delivery.service.DeliveryService;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class DeliveryController {
    private final DeliveryService deliveryService;

    @PostMapping("/payments/{paymentId}/delivery-info")
    public ResponseEntity<Void> updateDeliveryInfo(@PathVariable Long paymentId, @RequestBody DeliveryInfoRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        deliveryService.updateDeliveryInfo(paymentId, request, principal);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/deliveries/{deliveryId}/ship")
    public ResponseEntity<Void> shipProduct(@PathVariable Long deliveryId, @RequestBody ShipRequest request, @AuthenticationPrincipal UserPrincipal principal) {
        deliveryService.shipProduct(deliveryId, request, principal);
        return ResponseEntity.ok().build();
    }

    // 예시: /deliveries/track?carrierId=04&trackingNumber=123456789
    @GetMapping("/deliveries/track/{trackingNumber}")
    public ResponseEntity<TrackingInfo> getTrackingInfo(@PathVariable String trackingNumber) {
        return ResponseEntity.ok(deliveryService.getTrackingInfo(trackingNumber));
    }

    @PostMapping("/deliveries/{deliveryId}/confirm")
    public ResponseEntity<Void> confirmPurchase(@PathVariable Long deliveryId, @AuthenticationPrincipal UserPrincipal principal) {
        deliveryService.confirmPurchase(deliveryId, principal);
        return ResponseEntity.ok().build();
    }
}
