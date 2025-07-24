package com.suho149.liveauction.domain.user.service;

import com.suho149.liveauction.domain.auction.repository.BidRepository;
import com.suho149.liveauction.domain.delivery.entity.Address;
import com.suho149.liveauction.domain.payment.entity.Payment;
import com.suho149.liveauction.domain.payment.repository.PaymentRepository;
import com.suho149.liveauction.domain.product.dto.ProductResponse;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.entity.ProductStatus;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import com.suho149.liveauction.domain.user.dto.PurchaseHistoryResponse;
import com.suho149.liveauction.domain.user.dto.SaleHistoryResponse;
import com.suho149.liveauction.domain.user.dto.UserResponse;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.ReviewRepository;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final BidRepository bidRepository;
    private final ReviewRepository reviewRepository;

    /**
     * 현재 로그인한 사용자의 정보를 조회합니다.
     * @param userPrincipal 인증된 사용자의 정보
     * @return 사용자 정보 DTO
     */
    public UserResponse getMyInfo(UserPrincipal userPrincipal) {
        User user = userRepository.findByEmail(userPrincipal.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("유저를 찾을 수 없습니다. Email: " + userPrincipal.getEmail()));

        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public List<PurchaseHistoryResponse> getMyPurchaseHistory(UserPrincipal userPrincipal) {
        List<Payment> completedPayments = paymentRepository.findCompletedPaymentsByBuyerId(userPrincipal.getId());

        return completedPayments.stream()
                .map(payment -> {
                    // 현재 사용자가 이 거래에 대해 리뷰를 썼는지 확인
                    boolean hasWrittenReview = reviewRepository.existsByReviewerIdAndProductId(
                            userPrincipal.getId(),
                            payment.getProduct().getId()
                    );
                    // 확인된 값을 from 메소드에 전달
                    return PurchaseHistoryResponse.from(payment, hasWrittenReview);
                })
                .collect(Collectors.toList());
    }

    public List<SaleHistoryResponse> getMySaleHistory(UserPrincipal userPrincipal) {
        // 1. 내가 판매하고, 판매 완료된 상품 목록을 조회
        List<Product> soldProducts = productRepository.findProductsBySellerIdAndStatus(userPrincipal.getId(), ProductStatus.SOLD_OUT);

        // 2. 각 상품에 대한 결제 정보를 찾아 판매 완료 시간을 매핑
        return soldProducts.stream()
                .map(product -> {
                    // 해당 상품의 결제 정보를 찾음 (판매 완료되었으므로 반드시 존재)
                    Payment payment = paymentRepository.findByProductId(product.getId())
                            .orElseThrow(() -> new IllegalStateException("판매 완료된 상품의 결제 정보를 찾을 수 없습니다: " + product.getId()));
                    return SaleHistoryResponse.from(product, payment.getPaidAt());
                })
                .collect(Collectors.toList());
    }

    /**
     * 현재 사용자가 입찰에 참여 중인 상품 목록을 조회
     */
    @Transactional(readOnly = true)
    public List<ProductResponse> getMyBiddingProducts(UserPrincipal userPrincipal) {
        List<Product> products = bidRepository.findBiddingProductsByBidderIdAndStatus(userPrincipal.getId(), ProductStatus.ON_SALE);
        return products.stream()
                .map(ProductResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 현재 사용자가 판매 중(또는 경매 종료)인 상품 목록을 조회
     */
    @Transactional(readOnly = true)
    public List<ProductResponse> getMySellingProducts(UserPrincipal userPrincipal) {
        // 판매 완료(SOLD_OUT)를 제외한 모든 상태
        List<ProductStatus> statuses = Arrays.asList(
                ProductStatus.ON_SALE,
                ProductStatus.AUCTION_ENDED,
                ProductStatus.EXPIRED,
                ProductStatus.FAILED
        );
        List<Product> products = productRepository.findBySellerIdAndStatusInOrderByIdDesc(userPrincipal.getId(), statuses);
        return products.stream()
                .map(ProductResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateDefaultAddress(UserPrincipal principal, Address address) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new UsernameNotFoundException("기본 배송지를 업데이트할 사용자를 찾을 수 없습니다. ID: " + principal.getId()));
        user.updateDefaultAddress(address);
    }
}
