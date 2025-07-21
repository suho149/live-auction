package com.suho149.liveauction.domain.auction.controller;

import com.suho149.liveauction.domain.auction.dto.BidRequest;
import com.suho149.liveauction.domain.auction.dto.BuyNowRequest;
import com.suho149.liveauction.domain.auction.service.AuctionService;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class AuctionController {

    private final AuctionService auctionService;

    @MessageMapping("/products/{productId}/bids")
    public void bid(@DestinationVariable Long productId, BidRequest bidRequest, Principal principal) {
        if (principal == null) {
            // 비로그인 사용자의 입찰 시도 처리 (예: 에러 메시지를 특정 사용자에게만 보내기)
            // 혹은 그냥 무시
            return;
        }
        // Principal.getName()은 우리 설정상 사용자의 이메일을 반환합니다.
        auctionService.placeBid(productId, bidRequest, principal.getName());
    }

    // 입찰 처리 중 발생한 예외를 처리하는 핸들러
    @MessageExceptionHandler
    @SendToUser("/queue/errors") // 예외가 발생한 사용자에게만 /queue/errors 목적지로 메시지를 보냄
    public String handleException(Throwable exception, SimpMessageHeaderAccessor headerAccessor) {
        // 클라이언트에게 보낼 에러 메시지를 반환
        return exception.getMessage();
    }

    @PostMapping("/{productId}/buy-now")
    public ResponseEntity<Void> buyNow(@PathVariable Long productId, @RequestBody BuyNowRequest request, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        auctionService.buyNow(productId, request, userPrincipal.getEmail());
        return ResponseEntity.ok().build();
    }
}
