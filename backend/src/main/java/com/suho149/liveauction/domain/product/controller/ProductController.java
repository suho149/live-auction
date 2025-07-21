package com.suho149.liveauction.domain.product.controller;

import com.suho149.liveauction.domain.auction.dto.BuyNowRequest;
import com.suho149.liveauction.domain.auction.service.AuctionService;
import com.suho149.liveauction.domain.payment.dto.PaymentInfoResponse;
import com.suho149.liveauction.domain.payment.service.PaymentService;
import com.suho149.liveauction.domain.product.dto.ProductCreateRequest;
import com.suho149.liveauction.domain.product.dto.ProductDetailResponse;
import com.suho149.liveauction.domain.product.dto.ProductResponse;
import com.suho149.liveauction.domain.product.dto.ProductUpdateRequest;
import com.suho149.liveauction.domain.product.entity.Category;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.service.ProductService;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final AuctionService auctionService;
    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<Void> createProduct(@RequestBody ProductCreateRequest request, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Product createdProduct = productService.createProduct(request, userPrincipal);
        return ResponseEntity.created(URI.create("/api/v1/products/" + createdProduct.getId())).build();
    }

    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getProducts(
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) String keyword, // 검색어 파라미터 추가
            @RequestParam(defaultValue = "latest") String sort,
            @PageableDefault(size = 12) Pageable pageable) {
        return ResponseEntity.ok(productService.getProducts(category, keyword, sort, pageable));
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ProductDetailResponse> getProductDetail(
            @PathVariable Long productId,
            // @AuthenticationPrincipal은 인증되지 않은 사용자의 경우 null을 주입해 줍니다.
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return ResponseEntity.ok(productService.getProductDetail(productId, userPrincipal));
    }

    @PutMapping("/{productId}")
    public ResponseEntity<Void> updateProduct(@PathVariable Long productId, @RequestBody ProductUpdateRequest request, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        productService.updateProduct(productId, request, userPrincipal);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long productId, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        productService.deleteProduct(productId, userPrincipal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{productId}/end-auction")
    public ResponseEntity<Void> endAuctionEarly(@PathVariable Long productId, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        productService.endAuctionEarly(productId, userPrincipal);
        return ResponseEntity.ok().build();
    }

    /**
     * 상품을 즉시 구매합니다.
     * @param productId 구매할 상품의 ID
     * @param request 즉시 구매 가격 정보
     * @param userPrincipal 현재 인증된 사용자
     * @return ResponseEntity<Void>
     */
    // 즉시 구매 API 엔드포인트
    // 즉시 결제로 넘어가지는 않기 때문에 우선은 비사용
    @PostMapping("/{productId}/buy-now")
    public ResponseEntity<Void> buyNow(
            @PathVariable Long productId,
            @RequestBody BuyNowRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        // AuctionService의 buyNow 메소드를 호출하여 실제 로직을 처리합니다.
        auctionService.buyNow(productId, request, userPrincipal.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{productId}/buy-now/payment-info")
    public ResponseEntity<PaymentInfoResponse> createPaymentInfoForBuyNow(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PaymentInfoResponse info = paymentService.createPaymentInfoForBuyNow(productId, userPrincipal);
        return ResponseEntity.ok(info);
    }
}
