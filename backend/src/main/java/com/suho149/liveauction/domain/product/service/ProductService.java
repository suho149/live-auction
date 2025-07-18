package com.suho149.liveauction.domain.product.service;

import com.suho149.liveauction.domain.keyword.repository.KeywordRepository;
import com.suho149.liveauction.domain.notification.entity.NotificationType;
import com.suho149.liveauction.domain.product.dto.ProductCreateRequest;
import com.suho149.liveauction.domain.product.dto.ProductDetailResponse;
import com.suho149.liveauction.domain.product.dto.ProductResponse;
import com.suho149.liveauction.domain.product.dto.ProductUpdateRequest;
import com.suho149.liveauction.domain.product.entity.Category;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.entity.ProductImage;
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

    public Page<ProductResponse> getProducts(Category category, String keyword, String sortBy, Pageable pageable) {
        Sort sort = Sort.by(Sort.Direction.DESC, "id");
        if ("priceAsc".equals(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "currentPrice");
        } else if ("priceDesc".equals(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "currentPrice");
        }

        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        Page<Product> products;
        boolean hasKeyword = StringUtils.hasText(keyword); // 검색어가 있는지 확인

        if (category != null && category != Category.ALL) {
            // 카테고리 필터가 있을 때
            if (hasKeyword) {
                products = productRepository.findByCategoryAndKeywordWithSeller(category, keyword, sortedPageable);
            } else {
                products = productRepository.findByCategoryWithSeller(category, sortedPageable);
            }
        } else {
            // 카테고리 필터가 없을 때 ('ALL' 또는 null)
            if (hasKeyword) {
                products = productRepository.findByKeywordWithSeller(keyword, sortedPageable);
            } else {
                products = productRepository.findAllWithSeller(sortedPageable);
            }
        }

        return products.map(ProductResponse::from);
    }

    public ProductDetailResponse getProductDetail(Long productId, UserPrincipal userPrincipal) {
        Product product = productRepository.findByIdWithDetails(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        boolean likedByCurrentUser = false;
        boolean isSeller = false;

        // 로그인한 사용자일 경우에만 찜 여부와 판매자 여부를 확인
        if (userPrincipal != null) {
            likedByCurrentUser = likeRepository.existsByUserIdAndProductId(userPrincipal.getId(), productId);
            isSeller = product.getSeller().getId().equals(userPrincipal.getId());
        }

        return ProductDetailResponse.from(product, likedByCurrentUser, isSeller);
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

}
