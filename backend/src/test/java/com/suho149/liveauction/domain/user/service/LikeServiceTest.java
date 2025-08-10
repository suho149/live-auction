package com.suho149.liveauction.domain.user.service;

import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import com.suho149.liveauction.domain.user.dto.LikeResponse;
import com.suho149.liveauction.domain.user.entity.Like;
import com.suho149.liveauction.domain.user.entity.Role;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.LikeRepository;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import com.suho149.liveauction.global.security.UserPrincipal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// JUnit 5와 Mockito를 함께 사용하기 위한 어노테이션
@ExtendWith(MockitoExtension.class)
class LikeServiceTest {

    // @InjectMocks: 테스트할 대상인 LikeService를 생성합니다.
    // 이 클래스 내부에 @Mock으로 선언된 객체들이 자동으로 주입됩니다.
    @InjectMocks
    private LikeService likeService;

    // @Mock: LikeService가 의존하는 Repository들을 가짜 객체로 만듭니다.
    // 이 객체들은 실제 DB와 통신하지 않습니다.
    @Mock
    private LikeRepository likeRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;

    @Test
    @DisplayName("사용자가 찜하지 않은 상품에 찜을 하면, liked=true와 찜 개수+1이 반환되어야 한다.")
    void toggleLike_whenNotLiked_shouldLike() {
        // given (주어진 환경 설정)
        long productId = 1L;
        long userId = 1L;

        // 1. 테스트에 필요한 엔티티와 DTO 객체를 생성합니다.
        Product product = mock(Product.class); // Product 객체도 Mock으로 만듭니다.
        User user = User.builder()
                .name("testUser")
                .email("user@test.com")
                .role(Role.USER) // Role.USER를 명시적으로 설정
                .build();

        // UserPrincipal.create는 Long id가 필요합니다.
        // User 엔티티에는 id setter가 없으므로, UserPrincipal 생성자에 직접 값을 넣어줍니다.
        UserPrincipal userPrincipal = new UserPrincipal(userId, "user@test.com", List.of(new SimpleGrantedAuthority(Role.USER.getKey())));

        // 2. Mock 객체의 동작을 미리 정의합니다 (Stubbing).
        // - productRepository.findById(1L)이 호출되면, Optional.of(product)를 반환하도록 설정
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        // - likeRepository.findByUserIdAndProductId(1L, 1L)가 호출되면, 비어있는 Optional을 반환하도록 설정 (찜하지 않은 상태)
        when(likeRepository.findByUserIdAndProductId(userId, productId)).thenReturn(Optional.empty());
        // - userRepository.getReferenceById(1L)가 호출되면, user 객체를 반환하도록 설정
        when(userRepository.getReferenceById(userId)).thenReturn(user);

        // when (테스트할 동작 실행)
        LikeResponse response = likeService.toggleLike(productId, userPrincipal);

        // then (결과 검증)
        // 1. 반환된 DTO의 값이 예상과 일치하는지 확인
        assertThat(response.isLiked()).isTrue();

        // 2. Mock 객체의 특정 메소드가 정확히 1번 호출되었는지 검증
        // - product.increaseLikeCount()가 1번 호출되었는가?
        verify(product, times(1)).increaseLikeCount();
        // - likeRepository.save(Like 객체)가 1번 호출되었는가? (any()는 어떤 Like 객체든 상관없다는 의미)
        verify(likeRepository, times(1)).save(any(Like.class));
        // - product.decreaseLikeCount()는 호출되지 않았는가?
        verify(product, never()).decreaseLikeCount();
        // - likeRepository.delete()는 호출되지 않았는가?
        verify(likeRepository, never()).delete(any(Like.class));
    }

    @Test
    @DisplayName("사용자가 이미 찜한 상품에 찜을 하면(취소), liked=false와 찜 개수-1이 반환되어야 한다.")
    void toggleLike_whenAlreadyLiked_shouldUnlike() {
        // given
        long productId = 1L;
        long userId = 1L;

        Product product = mock(Product.class);
        User user = User.builder()
                .name("testUser")
                .email("user@test.com")
                .role(Role.USER) // ★ Role.USER를 명시적으로 설정
                .build();
        UserPrincipal userPrincipal = new UserPrincipal(userId, "user@test.com", List.of(new SimpleGrantedAuthority(Role.USER.getKey())));
        Like existingLike = Like.builder().user(user).product(product).build();

        // - productRepository.findById(1L) 호출 시, product 반환
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        // - likeRepository.findByUserIdAndProductId(1L, 1L) 호출 시, existingLike을 포함한 Optional 반환 (이미 찜한 상태)
        when(likeRepository.findByUserIdAndProductId(userId, productId)).thenReturn(Optional.of(existingLike));

        // when
        LikeResponse response = likeService.toggleLike(productId, userPrincipal);

        // then
        assertThat(response.isLiked()).isFalse();

        // - 찜 취소 로직이 올바르게 호출되었는지 검증
        verify(product, times(1)).decreaseLikeCount();
        verify(likeRepository, times(1)).delete(existingLike);
        verify(product, never()).increaseLikeCount();
        verify(likeRepository, never()).save(any(Like.class));
    }
}