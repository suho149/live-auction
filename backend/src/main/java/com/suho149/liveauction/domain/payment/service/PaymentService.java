package com.suho149.liveauction.domain.payment.service;

import com.suho149.liveauction.domain.notification.entity.NotificationType;
import com.suho149.liveauction.domain.notification.service.NotificationService;
import com.suho149.liveauction.domain.payment.dto.PaymentInfoResponse;
import com.suho149.liveauction.domain.payment.dto.PaymentRequest;
import com.suho149.liveauction.domain.payment.dto.PaymentSuccessResponse;
import com.suho149.liveauction.domain.payment.entity.Payment;
import com.suho149.liveauction.domain.payment.entity.PaymentStatus;
import com.suho149.liveauction.domain.payment.repository.PaymentRepository;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.entity.ProductStatus;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Value("${payment.toss.secret-key}")
    private String tossSecretKey;

    @Transactional
    public PaymentInfoResponse createPaymentInfo(Long productId, UserPrincipal userPrincipal) {
        Product product = productRepository.findById(productId).orElseThrow();

        // 낙찰자인지 확인
        if (product.getHighestBidder() == null || !product.getHighestBidder().getId().equals(userPrincipal.getId())) {
            throw new IllegalStateException("결제 권한이 없습니다.");
        }

        // 기존 결제 정보가 있는지 먼저 확인
        Payment payment = paymentRepository.findByProductId(productId)
                .orElseGet(() -> {
                    // 기존 정보가 없으면, 새로 생성하고 저장
                    String orderId = "order_" + productId + "_" + System.currentTimeMillis();
                    User buyer = userRepository.getReferenceById(userPrincipal.getId());

                    return paymentRepository.save(
                            Payment.builder()
                                    .product(product)
                                    .buyer(buyer)
                                    .orderId(orderId)
                                    .amount(product.getCurrentPrice())
                                    .build()
                    );
                });

        // 기존 정보가 있든, 새로 만들었든, 해당 payment 정보를 기반으로 응답 DTO 생성
        return PaymentInfoResponse.builder()
                .orderId(payment.getOrderId())
                .productName(product.getName())
                .amount(payment.getAmount())
                .buyerName(userPrincipal.getName())
                .buyerEmail(userPrincipal.getEmail())
                .build();
    }

    @Transactional
    public PaymentSuccessResponse confirmPayment(PaymentRequest request, UserPrincipal userPrincipal) {

        log.info(">>>>> [결제 승인 요청 시작] orderId: {}, amount: {}", request.getOrderId(), request.getAmount());

        Payment payment = paymentRepository.findByOrderId(request.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 주문입니다."));

        log.info(">>>>> [DB 조회 데이터] orderId: {}, amount: {}", payment.getOrderId(), payment.getAmount());

        // 결제 금액 검증
        if (!payment.getAmount().equals(request.getAmount())) {

            log.error(">>>>> [결제 금액 불일치] 요청된 금액: {}, DB 저장 금액: {}", request.getAmount(), payment.getAmount());
            throw new IllegalStateException("결제 금액이 일치하지 않습니다.");
        }

        // 토스페이먼츠에 결제 승인 요청
        // RestTemplate 또는 WebClient 사용
        // ... (아래는 RestTemplate 예시)
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        String encodedKey = Base64.getEncoder().encodeToString((tossSecretKey + ":").getBytes());
        headers.setBasicAuth(encodedKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> payload = new HashMap<>();
        payload.put("orderId", request.getOrderId());
        payload.put("amount", String.valueOf(request.getAmount()));

        // 4. 토스페이먼츠로 보낼 최종 데이터 로그
        log.info(">>>>> [토스페이먼츠 요청 데이터] orderId: {}, amount: {}", payload.get("orderId"), payload.get("amount"));

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://api.tosspayments.com/v1/payments/" + request.getPaymentKey(),
                    entity,
                    String.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                // 결제 정보 업데이트 (상태: COMPLETED, paymentKey, paidAt)
                payment.completePayment(request.getPaymentKey());

                // 최종 낙찰 처리 로직 추가
                Product product = payment.getProduct();
                User buyer = payment.getBuyer();

                product.updateBid(buyer, payment.getAmount()); // 최종 낙찰자 및 가격 확정
                product.soldOut(); // 상태를 '판매 완료'로 변경

                log.info(">>>>> [결제 승인 성공] orderId: {}", request.getOrderId());

                // 결제 완료 시 판매자에게 알림 발송 로직 추가
                String content = "'" + payment.getProduct().getName() + "' 상품의 결제가 완료되어 판매가 확정되었습니다.";
                String url = "/products/" + payment.getProduct().getId();
                notificationService.send(payment.getProduct().getSeller(), NotificationType.BID, content, url);
                log.info(">>>>> [판매자에게 결제 완료 알림 발송] 상품 ID: {}, 판매자: {}", payment.getProduct().getId(), payment.getProduct().getSeller().getName());

                // 성공 응답 DTO 생성 및 반환
                return PaymentSuccessResponse.builder()
                        .productName(payment.getProduct().getName())
                        .amount(payment.getAmount())
                        .orderId(payment.getOrderId())
                        .build();
            } else {
                // 이 코드는 보통 실행되지 않지만, 만약을 위해 남겨둡니다.
                // 성공이 아닌 다른 2xx 응답이 올 경우를 대비합니다.
                throw new RuntimeException("토스페이먼츠 결제는 성공했으나, 승인 처리 중 문제가 발생했습니다.");
            }
        } catch (HttpClientErrorException e) {
            log.error(">>>>> [토스페이먼츠 API 에러] Status: {}, Body: {}", e.getStatusCode(), e.getResponseBodyAsString());
            // 에러 메시지를 포함하여 예외를 다시 던져서 GlobalExceptionHandler가 처리하도록 함
            throw new RuntimeException("결제 승인 중 오류가 발생했습니다. 토스페이먼츠 응답: " + e.getResponseBodyAsString(), e);
        }
    }

    @Transactional
    public PaymentInfoResponse createPaymentInfoForBuyNow(Long productId, UserPrincipal userPrincipal) {
        // 1. 비관적 락으로 상품 정보 조회 (동시에 다른 사람이 즉시 구매/입찰하는 것 방지)
        Product product = productRepository.findByIdWithPessimisticLock(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. ID: " + productId));

        User buyer = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new UsernameNotFoundException("인증된 사용자 정보를 DB에서 찾을 수 없습니다. ID: " + userPrincipal.getId()));

        // 2. 즉시 구매 가능 여부 재확인
        if (product.getBuyNowPrice() == null) {
            throw new IllegalStateException("즉시 구매가 불가능한 상품입니다.");
        }
        if (product.getStatus() != ProductStatus.ON_SALE) {
            throw new IllegalStateException("현재 판매 중인 상품이 아닙니다.");
        }
        if (product.getSeller().getId().equals(buyer.getId())) {
            throw new IllegalStateException("자신이 등록한 상품은 구매할 수 없습니다.");
        }
        // 현재 입찰가가 즉시 구매가보다 높아졌는지 확인
        if (product.getCurrentPrice() >= product.getBuyNowPrice()) {
            throw new IllegalStateException("현재 입찰가가 즉시 구매가보다 높으므로 즉시 구매할 수 없습니다.");
        }

        // 3. 기존 PENDING 상태의 결제가 있는지 확인 (다른 사람이 동시에 시도하는 경우 방지)
        paymentRepository.findByProductIdAndStatus(productId, PaymentStatus.PENDING).ifPresent(p -> {
            throw new IllegalStateException("다른 사용자가 결제를 시도 중입니다. 잠시 후 다시 시도해주세요.");
        });

        // 4. 새로운 결제 정보 생성 (상태: PENDING)
        String orderId = "order_" + productId + "_" + System.currentTimeMillis();
        Payment payment = Payment.builder()
                .product(product)
                .buyer(buyer)
                .orderId(orderId)
                .amount(product.getBuyNowPrice()) // ★ 결제 금액은 즉시 구매가
                .build();
        paymentRepository.save(payment);

        log.info("즉시 구매 결제 정보 생성 완료. Order ID: {}", orderId);

        // 5. 프론트엔드로 결제 정보 반환
        return PaymentInfoResponse.builder()
                .orderId(payment.getOrderId())
                .productName(product.getName())
                .amount(payment.getAmount())
                .buyerName(userPrincipal.getName())
                .buyerEmail(userPrincipal.getEmail())
                .build();
    }
}
