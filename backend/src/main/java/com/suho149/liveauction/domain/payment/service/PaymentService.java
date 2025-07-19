package com.suho149.liveauction.domain.payment.service;

import com.suho149.liveauction.domain.payment.dto.PaymentInfoResponse;
import com.suho149.liveauction.domain.payment.dto.PaymentRequest;
import com.suho149.liveauction.domain.payment.entity.Payment;
import com.suho149.liveauction.domain.payment.repository.PaymentRepository;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

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
    public void confirmPayment(PaymentRequest request, UserPrincipal userPrincipal) {
        Payment payment = paymentRepository.findByOrderId(request.getOrderId()).orElseThrow();

        // 결제 금액 검증
        if (!payment.getAmount().equals(request.getAmount())) {
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

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(payload, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "https://api.tosspayments.com/v1/payments/" + request.getPaymentKey(),
                entity,
                String.class
        );

        if (response.getStatusCode() == HttpStatus.OK) {
            payment.completePayment(request.getPaymentKey());
        } else {
            throw new RuntimeException("토스페이먼츠 결제 승인에 실패했습니다.");
        }
    }
}
