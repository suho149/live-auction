package com.suho149.liveauction.domain.product.service;

import com.suho149.liveauction.domain.product.dto.ProductCreateRequest;
import com.suho149.liveauction.domain.product.dto.ProductDetailResponse;
import com.suho149.liveauction.domain.product.dto.ProductResponse;
import com.suho149.liveauction.domain.product.entity.Category;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.entity.ProductImage;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.UserRepository;
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

        return productRepository.save(product);
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

    public ProductDetailResponse getProductDetail(Long productId) {
        Product product = productRepository.findByIdWithDetails(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        return ProductDetailResponse.from(product);
    }
}
