package com.suho149.liveauction.domain.product.controller;

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
}
