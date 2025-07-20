package com.suho149.liveauction.domain.payment.service;

import com.suho149.liveauction.domain.payment.dto.PaymentInfoResponse;
import com.suho149.liveauction.domain.payment.dto.PaymentRequest;
import com.suho149.liveauction.domain.payment.dto.PaymentSuccessResponse;
import com.suho149.liveauction.domain.payment.entity.Payment;
import com.suho149.liveauction.domain.payment.repository.PaymentRepository;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
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

        // ★★★ 4. 토스페이먼츠로 보낼 최종 데이터 로그
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
                payment.getProduct().soldOut(); // 상품 상태 변경 로직
                // ★ Product의 상태를 '판매 완료'로 바꾸는 로직 추가 고려
                // 예: payment.getProduct().updateStatus(ProductStatus.SOLD_OUT);

                log.info(">>>>> [결제 승인 성공] orderId: {}", request.getOrderId());

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
}
