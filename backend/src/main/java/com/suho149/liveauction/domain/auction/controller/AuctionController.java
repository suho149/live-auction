package com.suho149.liveauction.domain.auction.controller;

import com.suho149.liveauction.domain.auction.dto.BidRequest;
import com.suho149.liveauction.domain.auction.service.AuctionService;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

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
}
