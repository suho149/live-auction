package com.suho149.liveauction.domain.product.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.suho149.liveauction.domain.keyword.repository.KeywordRepository;
import com.suho149.liveauction.domain.payment.service.PaymentService;
import com.suho149.liveauction.domain.product.dto.ProductCreateRequest;
import com.suho149.liveauction.domain.product.entity.Category;
import com.suho149.liveauction.domain.product.entity.Product;
import com.suho149.liveauction.domain.product.repository.ProductRepository;
import com.suho149.liveauction.domain.user.entity.Role;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import com.suho149.liveauction.global.jwt.JwtTokenProvider;
import com.suho149.liveauction.global.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// @SpringBootTest: 실제 애플리케이션처럼 모든 Bean을 로드하여 통합 테스트를 진행
@SpringBootTest
// @AutoConfigureMockMvc: MockMvc를 주입받아 컨트롤러 API 테스트를 할 수 있게 함
@AutoConfigureMockMvc
// @Transactional: 각 테스트 후 DB를 롤백하여 테스트 간 독립성을 보장
@Transactional
@ActiveProfiles("test")
class ProductControllerTest {

    // 1. Redis 의존성을 가진 JwtTokenProvider를 Mocking하여 연쇄적인 Bean 생성 오류를 차단합니다.
    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    // 2. 상품 등록 시 알림 이벤트를 발행하므로, ApplicationEventPublisher도 Mocking하여
    //    실제 이벤트 리스너가 동작하지 않도록 합니다. 이렇게 하면 테스트가 더 빨라지고 격리됩니다.
    @MockitoBean
    private ApplicationEventPublisher eventPublisher;

    // MockMvc: HTTP 요청을 시뮬레이션하는 객체
    @Autowired
    private MockMvc mockMvc;

    // ObjectMapper: Java 객체를 JSON 문자열로 변환하기 위해 사용
    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @MockitoBean
    private PaymentService paymentService;

    @MockitoBean
    private KeywordRepository keywordRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        // 상품을 등록할 테스트용 사용자를 미리 DB에 저장
        testUser = User.builder()
                .name("testUser")
                .email("testuser@example.com")
                .role(Role.USER)
                .build();
        userRepository.save(testUser);
    }

    @Test
    @DisplayName("인증되지 않은 사용자가 상품 등록 시 401 Unauthorized 에러가 발생해야 한다.")
    void createProduct_withAnonymousUser_shouldFail() throws Exception {
        // given
        ProductCreateRequest request = createProductCreateRequest();

        // when & then
        mockMvc.perform(post("/api/v1/products") // POST 요청 시뮬레이션
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))) // 요청 본문에 DTO를 JSON으로 변환하여 담음
                .andExpect(status().isUnauthorized()) // 응답 상태가 401인지 검증
                .andDo(print()); // 요청/응답 전체 내용을 콘솔에 출력
    }

    // @WithMockUser: 'testuser@example.com'라는 이름과 'USER' 역할을 가진 가짜 사용자가
    // 로그인한 상태를 시뮬레이션합니다. UserDetailsService가 이 이메일로 사용자를 찾을 수 있어야 합니다.
    @Test
    @DisplayName("인증된 사용자가 상품 등록 시 성공하고, DB에 상품이 저장되어야 한다.")
    void createProduct_withAuthenticatedUser_shouldSucceed() throws Exception {
        // given
        ProductCreateRequest request = createProductCreateRequest();

        when(keywordRepository.findUsersByKeywordIn(anyString())).thenReturn(List.of());

        // UserPrincipal.create()를 사용하여 올바른 Authentication 객체 생성
        UserPrincipal userPrincipal = UserPrincipal.create(testUser);
        Authentication auth = new UsernamePasswordAuthenticationToken(
                userPrincipal,
                null,
                userPrincipal.getAuthorities()
        );

        // when
        mockMvc.perform(post("/api/v1/products")
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andDo(print());

        // then
        List<Product> products = productRepository.findAll();
        assertThat(products).hasSize(1);

        Product savedProduct = products.get(0);
        assertThat(savedProduct.getName()).isEqualTo(request.getName());
        assertThat(savedProduct.getStartPrice()).isEqualTo(request.getStartPrice());
        assertThat(savedProduct.getSeller().getName()).isEqualTo(testUser.getName());
    }

    private ProductCreateRequest createProductCreateRequest() {
        ProductCreateRequest request = new ProductCreateRequest();
        request.setName("테스트 경매 상품");
        request.setDescription("이것은 테스트 상품입니다.");
        request.setStartPrice(10000L);
        request.setBuyNowPrice(50000L);
        request.setCategory(Category.ETC);
        request.setAuctionEndTime(LocalDateTime.now().plusDays(3));
        request.setImageUrls(List.of("/images/test1.jpg", "/images/test2.jpg"));
        return request;
    }
}