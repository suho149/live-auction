package com.suho149.liveauction.domain.product.service;

import com.suho149.liveauction.domain.auction.repository.AutoBidRepository;
import com.suho149.liveauction.domain.auction.repository.BidRepository;
import com.suho149.liveauction.domain.keyword.repository.KeywordRepository;
import com.suho149.liveauction.domain.notification.entity.NotificationType;
import com.suho149.liveauction.domain.product.dto.*;
import com.suho149.liveauction.domain.product.entity.Category;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.entity.ProductImage;
import com.suho149.liveauction.domain.product.entity.ProductStatus;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.LikeRepository;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import com.suho149.liveauction.domain.notification.service.NotificationService;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final NotificationService notificationService;
    private final KeywordRepository keywordRepository;
    private final AutoBidRepository autoBidRepository;
    private final BidRepository bidRepository;

    @Transactional
    public Product createProduct(ProductCreateRequest request, UserPrincipal userPrincipal) {
        User seller = userRepository.findByEmail(userPrincipal.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("판매자를 찾을 수 없습니다."));

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .startPrice(request.getStartPrice())
                .category(request.getCategory())
                .auctionEndTime(request.getAuctionEndTime())
                .seller(seller)
                .buyNowPrice(request.getBuyNowPrice())
                .build();

        // 이미지 URL들을 ProductImage 엔티티로 변환하고 Product에 추가
        List<ProductImage> images = request.getImageUrls().stream()
                .map(url -> ProductImage.builder().imageUrl(url).product(product).build())
                .collect(Collectors.toList());
        images.forEach(product::addImage);

        Product savedProduct = productRepository.save(product);

        // 키워드 알림 로직 수정
        String productInfo = savedProduct.getName() + " " + savedProduct.getDescription();
        List<User> usersToNotify = keywordRepository.findUsersByKeywordIn(productInfo);

        usersToNotify.forEach(user -> {
            // 본인이 등록한 상품에 대해서는 알림을 보내지 않음
            if (!user.getId().equals(userPrincipal.getId())) {
                String content = "등록하신 키워드가 포함된 '" + savedProduct.getName() + "' 상품이 등록되었습니다.";
                String url = "/products/" + savedProduct.getId();
                notificationService.send(user, NotificationType.KEYWORD, content, url);
            }
        });

        return savedProduct;
    }

    public Page<ProductResponse> getProducts(ProductSearchCondition condition, Pageable pageable) {
        // 기본적으로 ON_SALE 상태만 보여주도록 설정
        if (condition.getStatuses() == null || condition.getStatuses().isEmpty()) {
            condition.setStatuses(List.of(ProductStatus.ON_SALE));
        }
        return productRepository.search(condition, pageable).map(ProductResponse::from);
    }

    public ProductDetailResponse getProductDetail(Long productId, UserPrincipal userPrincipal) {
        Product product = productRepository.findByIdWithDetails(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        boolean likedByCurrentUser = false;
        boolean isSeller = false;
        Long myAutoBidMaxAmount = null; // 기본값은 null

        // 로그인한 사용자일 경우에만 찜 여부와 판매자 여부를 확인
        if (userPrincipal != null) {
            likedByCurrentUser = likeRepository.existsByUserIdAndProductId(userPrincipal.getId(), productId);
            isSeller = product.getSeller().getId().equals(userPrincipal.getId());

            // 현재 사용자의 자동 입찰 설정 금액을 조회
            myAutoBidMaxAmount = autoBidRepository.findByUser_IdAndProduct_Id(userPrincipal.getId(), productId)
                    .map(autoBid -> autoBid.getMaxAmount())
                    .orElse(null);
        }

        // 총 입찰 참여자 수 계산
        long participantCount = bidRepository.countDistinctBiddersByProductId(productId);

        return ProductDetailResponse.from(product, likedByCurrentUser, isSeller, myAutoBidMaxAmount, participantCount);
    }

    @Transactional
    public void updateProduct(Long productId, ProductUpdateRequest request, UserPrincipal userPrincipal) {
        Product product = findProductAndCheckOwnership(productId, userPrincipal.getId());

        // 입찰 시작 여부 확인
        if (product.getHighestBidder() != null) {
            throw new IllegalStateException("이미 입찰이 시작된 상품은 수정할 수 없습니다.");
        }

        product.updateDetails(request.getName(), request.getDescription(), request.getCategory());
        // 이미지 수정 로직은 더 복잡하므로, 지금은 이름/설명/카테고리만 수정
    }

    @Transactional
    public void deleteProduct(Long productId, UserPrincipal userPrincipal) {
        Product product = findProductAndCheckOwnership(productId, userPrincipal.getId());
        productRepository.delete(product);
    }

    // 상품 소유권 확인을 위한 private 메소드
    private Product findProductAndCheckOwnership(Long productId, Long userId) {
        Product product = productRepository.findByIdWithSeller(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        if (!product.getSeller().getId().equals(userId)) {
            throw new IllegalStateException("해당 상품에 대한 수정/삭제 권한이 없습니다.");
        }
        return product;
    }

    @Transactional // 쓰기 작업이므로 @Transactional 추가
    public void endAuctionEarly(Long productId, UserPrincipal userPrincipal) {
        // 1. 상품 소유권 확인 (기존 메소드 재활용)
        Product product = findProductAndCheckOwnership(productId, userPrincipal.getId());

        // 2. 현재 경매가 진행 중인 상태인지 확인
        if (product.getStatus() != ProductStatus.ON_SALE) {
            throw new IllegalStateException("현재 판매 중인 경매만 조기 종료할 수 있습니다.");
        }

        String url = "/products/" + product.getId();

        // 3. 최고 입찰자 유무에 따라 상태 변경 및 알림 발송 (스케줄러와 동일한 로직)
        if (product.getHighestBidder() != null) {
            // 낙찰자가 있는 경우
            product.endAuctionWithWinner();
            String winnerContent = "'" + product.getName() + "' 상품에 최종 낙찰되었습니다! 판매자가 경매를 조기 종료했습니다.";
            notificationService.send(product.getHighestBidder(), NotificationType.BID, winnerContent, url);
        } else {
            // 낙찰자가 없는 경우 (유찰)
            product.endAuctionWithNoBidder();
            String sellerContent = "요청에 따라 '" + product.getName() + "' 상품의 경매를 조기 종료했습니다. (유찰)";
            notificationService.send(product.getSeller(), NotificationType.BID, sellerContent, url);
        }
    }

}
