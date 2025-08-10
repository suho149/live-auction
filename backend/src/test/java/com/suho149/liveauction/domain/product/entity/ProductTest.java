package com.suho149.liveauction.domain.product.entity;

import com.suho149.liveauction.domain.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat; // AssertJ를 사용한 검증

// JUnit 5 테스트 클래스
class ProductTest {

    private User seller;
    private User bidder;

    // @BeforeEach: 각 테스트 메소드가 실행되기 전에 항상 먼저 실행되는 부분
    @BeforeEach
    void setUp() {
        // 테스트에 사용할 User 객체를 미리 만들어 둡니다.
        seller = User.builder().name("판매자").email("seller@test.com").build();
        bidder = User.builder().name("입찰자").email("bidder@test.com").build();
    }

    @Test
    @DisplayName("상품 생성 시 초기 상태는 ON_SALE 이고 현재가는 시작가와 동일해야 한다.")
    void createProduct_InitialState() {
        // given (주어진 환경)
        long startPrice = 1000L;

        // when (테스트할 동작 실행)
        Product product = Product.builder()
                .name("테스트 상품")
                .startPrice(startPrice)
                .auctionEndTime(LocalDateTime.now().plusDays(1))
                .seller(seller)
                .category(Category.ETC)
                .description("설명")
                .build();

        // then (결과 검증)
        assertThat(product.getStatus()).isEqualTo(ProductStatus.ON_SALE);
        assertThat(product.getCurrentPrice()).isEqualTo(startPrice);
        assertThat(product.getHighestBidder()).isNull();
    }

    @Test
    @DisplayName("입찰이 발생하면 현재가와 최고 입찰자가 업데이트되어야 한다.")
    void updateBid_UpdatesPriceAndBidder() {
        // given
        Product product = createTestProduct(1000L);
        long newBidAmount = 2000L;

        // when
        product.updateBid(bidder, newBidAmount);

        // then
        assertThat(product.getCurrentPrice()).isEqualTo(newBidAmount);
        assertThat(product.getHighestBidder()).isEqualTo(bidder);
    }

    @Test
    @DisplayName("낙찰자가 있는 경매 종료 시, 상태는 AUCTION_ENDED가 되고 결제 기한이 설정되어야 한다.")
    void endAuctionWithWinner_ChangesStateAndSetsDueDate() {
        // given
        Product product = createTestProduct(1000L);
        product.updateBid(bidder, 2000L); // 낙찰자 설정

        // when
        product.endAuctionWithWinner();

        // then
        assertThat(product.getStatus()).isEqualTo(ProductStatus.AUCTION_ENDED);
        assertThat(product.getPaymentDueDate()).isNotNull();
        // 결제 기한이 현재 시간으로부터 약 24시간 뒤인지 확인
        assertThat(product.getPaymentDueDate()).isAfter(LocalDateTime.now().plusHours(23));
    }

    @Test
    @DisplayName("낙찰자 없는 경매 종료(유찰) 시, 상태는 FAILED가 되어야 한다.")
    void endAuctionWithNoBidder_ChangesStateToFailed() {
        // given
        Product product = createTestProduct(1000L);

        // when
        product.endAuctionWithNoBidder();

        // then
        assertThat(product.getStatus()).isEqualTo(ProductStatus.FAILED);
        assertThat(product.getPaymentDueDate()).isNull();
    }

    @Test
    @DisplayName("softDelete 호출 시, 상태가 DELETED로 변경되어야 한다.")
    void softDelete_ChangesStateToDeleted() {
        // given
        Product product = createTestProduct(1000L);

        // when
        product.softDelete();

        // then
        assertThat(product.getStatus()).isEqualTo(ProductStatus.DELETED);
    }

    // 테스트 코드 중복을 줄이기 위한 헬퍼 메소드
    private Product createTestProduct(long startPrice) {
        return Product.builder()
                .name("테스트 상품")
                .startPrice(startPrice)
                .auctionEndTime(LocalDateTime.now().plusDays(1))
                .seller(seller)
                .category(Category.ETC)
                .description("설명")
                .build();
    }
}