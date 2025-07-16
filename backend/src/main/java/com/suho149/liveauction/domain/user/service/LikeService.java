package com.suho149.liveauction.domain.user.service;

import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import com.suho149.liveauction.domain.user.dto.LikeResponse;
import com.suho149.liveauction.domain.user.entity.Like;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.LikeRepository;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LikeService {
    private final LikeRepository likeRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public LikeResponse toggleLike(Long productId, UserPrincipal userPrincipal) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        Long userId = userPrincipal.getId();

        return likeRepository.findByUserIdAndProductId(userId, productId)
                .map(like -> {
                    likeRepository.delete(like);
                    product.decreaseLikeCount();
                    return new LikeResponse(false, product.getLikeCount());
                })
                .orElseGet(() -> {
                    User userProxy = userRepository.getReferenceById(userId);
                    likeRepository.save(Like.builder().user(userProxy).product(product).build());
                    product.increaseLikeCount();
                    return new LikeResponse(true, product.getLikeCount());
                });
    }
}
