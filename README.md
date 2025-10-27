# 🚀 UpBid (실시간 경매 웹 애플리케이션)

<br>

<p align="center">
  <img width="2535" height="1318" alt="Image" src="https://github.com/user-attachments/assets/177b259e-507f-45a6-a07a-dd4e4954c683" />
  <!-- TODO: 프로젝트를 잘 나타내는 배너 이미지나 GIF를 추가하세요. -->
</p>

<br>

## 📖 프로젝트 소개 (Introduction)

**UpBid(Real-Time Auction)** 는 WebSocket 기술을 기반으로 사용자들이 실시간으로 경매에 참여하고 소통할 수 있는 동적인 웹 애플리케이션입니다. 상품을 등록하여 판매하고, 원하는 상품에 입찰하거나 즉시 구매하며, 판매자와 실시간으로 채팅하는 등 경매의 모든 과정을 웹에서 경험할 수 있도록 구현했습니다.

<br>

## 🎥 프로젝트 시연 영상 (Introduction)

### 1. 구글 로그인
![Image](https://github.com/user-attachments/assets/e9b9a85d-8311-4327-8178-40d9e2b782be)

- Spring Security, OAuth 2.0, JWT (JSON Web Token)
- 사용자가 구글 로그인 시, Spring Security의 OAuth 2.0 클라이언트가 인증 과정을 처리합니다. 인증 성공 후 백엔드는 서버에서 자체적으로 Access Token과 Refresh Token을 발급하여 클라이언트에 전달합니다. 이후의 모든 API 요청은 이 JWT를 통해 인가(Authorization) 처리됩니다.

<br><br>

### 2. 상품 상세 페이지 & 판매자와 채팅
![Image](https://github.com/user-attachments/assets/ccb3ceff-be7b-4847-ba42-e9a061a7ddb9)

- Spring Data JPA (Fetch Join), WebSocket, STOMP
- 상품 상세 정보 조회 시 발생할 수 있는 N+1 문제를 해결하기 위해 JPQL의 Fetch Join을 사용하여 연관된 엔티티(판매자, 이미지 등)를 한 번의 쿼리로 가져옵니다. 채팅 기능은 WebSocket과 STOMP 프로토콜을 사용하여 구현하였으며, 사용자가 채팅방에 입장하면 특정 채널을 구독하여 실시간으로 메시지를 주고받습니다.

<br><br>

### 3. 상품 문의
![Image](https://github.com/user-attachments/assets/a4beb3ac-48e6-417b-a1e2-6510c13d2fea)

- JPA, Spring Events, SSE (Server-Sent Events)
- 사용자가 질문을 등록하면 REST API를 통해 Question 엔티티가 DB에 저장됩니다. 동시에 NotificationEvent를 발행하여, 트랜잭션이 성공적으로 커밋된 후에만 판매자에게 SSE를 통해 실시간으로 "새로운 문의 도착" 알림이 전송됩니다.

<br><br>

### 4. 상품 문의(비밀글)
![Image](https://github.com/user-attachments/assets/3476d41a-8833-44e1-82c8-3c48f4cb03ba)

![Image](https://github.com/user-attachments/assets/d4d38e2d-6406-4709-a30e-4b6a461b54fc)

- 질문 등록 시 '비밀글' 여부를 boolean 값으로 함께 저장합니다. Q&A 목록 조회 API에서는 현재 로그인한 사용자가 질문 작성자 본인이거나 상품 판매자일 경우에만 해당 질문의 내용을 볼 수 있도록 백엔드 서비스 로직에서 접근 권한을 검증합니다.

<br><br>

### 5. 상품 키워드 등록
![Image](https://github.com/user-attachments/assets/ea388be5-5088-4ca3-8767-2e0e94f7bc47)

- JPA
- 사용자가 등록한 관심 키워드는 Keyword 테이블에 사용자 ID와 함께 저장됩니다. 이 데이터는 추후 상품 등록 시 알림을 보낼 대상자를 필터링하는 데 사용됩니다.

<br><br>

### 6. 상품 등록 & 키워드 알림
![Image](https://github.com/user-attachments/assets/6d982a71-4bc1-402b-a039-092648b06f27)

- JPQL (LIKE 연산), Spring Events, SSE
- 상품이 등록되면, ProductService는 저장된 상품의 이름과 설명을 기반으로 KeywordRepository의 JPQL 쿼리(LIKE '%keyword%')를 실행합니다. 이 쿼리는 해당 키워드를 등록한 모든 사용자를 찾아내고, 각 사용자에게 SSE를 통해 "관심 키워드 상품 등록" 알림을 실시간으로 보냅니다.

<br><br>

### 7. 상품 경매
![Image](https://github.com/user-attachments/assets/0c6fa2ff-0a74-4961-ace3-a5db6ead54b4)

- WebSocket, STOMP, Pessimistic Lock (비관적 락)
- 여러 사용자가 동시에 입찰할 때 발생할 수 있는 데이터 경합(Race Condition)을 방지하기 위해, AuctionService는 입찰 처리 시 JPA의 @Lock(LockModeType.PESSIMISTIC_WRITE)을 사용하여 Product row에 DB 레벨의 락을 겁니다. 입찰 처리 후, 갱신된 가격은 WebSocket을 통해 해당 상품 채널을 구독 중인 모든 클라이언트에게 실시간으로 브로드캐스팅됩니다.

<br><br>

### 8. 경매 자동 입찰
![Image](https://github.com/user-attachments/assets/b054f7a4-523a-4d83-b0db-a1ce30bcd2cc)

![Image](https://github.com/user-attachments/assets/7c688dbd-7e4e-4ec4-9075-d8ee348d18bb)

- JPA, Transactional 비즈니스 로직
- 새로운 입찰이 발생할 때마다, AuctionService의 processAutoBids 메서드가 실행됩니다. 이 메서드는 해당 상품의 모든 AutoBid 설정을 조회하여, 현재 최고 입찰자와 경쟁적으로 자동 입찰을 진행하는 복잡한 비즈니스 로직을 트랜잭션 내에서 처리합니다.

<br><br>

### 9. 상품 즉시 구매(상품 결제)
![Image](https://github.com/user-attachments/assets/3ed28dc4-5a1b-4075-82e0-b87219550523)

- Toss Payments API, REST API
- 사용자가 '즉시 구매'를 요청하면, PaymentService는 PENDING 상태의 결제 정보를 생성하고 토스페이먼츠에 필요한 주문 정보를 프론트엔드에 전달합니다. 결제 위젯에서 인증이 완료되면, 백엔드는 토스페이먼츠 서버와 최종 통신하여 결제를 승인하고 Product의 상태를 SOLD_OUT으로 변경합니다.

<br><br>

### 10. 배송지 입력
![Image](https://github.com/user-attachments/assets/a813b0c1-6114-43a9-a7c8-41c37c797647)

- JPA (Embedded Type), REST API
- 사용자의 주소 정보는 @Embedded 타입인 Address 객체로 관리됩니다. 배송지 입력 API를 통해 Delivery 엔티티에 배송지 정보가 업데이트되고, 배송 상태가 '배송 준비 중'으로 변경됩니다.

<br><br>

### 11. 판매자 상품 발송 처리
![Image](https://github.com/user-attachments/assets/8d052eaf-e20c-4690-8bc4-4b90b613956c)

- Spring Scheduler, Transactional
- DeliveryScheduler가 주기적으로 실행되어 '배송 준비 중' 상태인 모든 주문을 찾아 가상의 운송장 번호를 부여하고 '배송 중' 상태로 일괄 변경합니다. 이 과정은 실제 물류 시스템과의 연동을 시뮬레이션하며, 상태 변경 시 구매자에게 SSE 알림이 전송됩니다.

<br><br>

### 12. 배송 완료 후 구매 확정
![Image](https://github.com/user-attachments/assets/c332f3e1-2013-4422-9b6a-3730adc85c82)

- Spring Events, JPA
- 구매자가 '구매 확정' API를 호출하면, Delivery 상태가 CONFIRMED로 변경됩니다. 동시에 SettlementEvent를 발행하여, 트랜잭션 커밋 후에 판매자를 위한 '정산 가능'(AVAILABLE) 상태의 Settlement 데이터가 생성되도록 합니다.

<br><br>

### 13. 리뷰 작성
![Image](https://github.com/user-attachments/assets/55eada3f-7d49-46d0-aec1-9ef6e370b6d4)

- JPA (Unique Constraint)
- 거래가 완료된 상품에 대해 구매자는 리뷰를 작성할 수 있습니다. Review 테이블에는 (reviewer_id, reviewee_id, product_id)에 대한 Unique Constraint를 설정하여, 한 거래에 대해 동일한 리뷰가 중복 작성되는 것을 DB 레벨에서 방지합니다.

<br><br>

### 14. 판매자 정산 요청 & 관리자 정산 승인
![Image](https://github.com/user-attachments/assets/9d5b8970-bf94-4a24-a515-638d6337e51b)

- REST API (for User & Admin), JPA
- 판매자가 '정산 요청' API를 호출하면, AVAILABLE 상태의 모든 Settlement 건들이 REQUESTED 상태로 변경됩니다. 관리자는 관리자 페이지에서 REQUESTED 상태의 정산 목록을 조회하고, '승인' API를 통해 해당 건을 COMPLETED 상태로 변경하며 판매자에게 SSE 알림을 보냅니다.

<br><br>

### 15. 상품 신고 & 관리자 승인
![Image](https://github.com/user-attachments/assets/1f6d4b13-2538-4a2c-8375-182b609ed3ee)

- Soft Delete, Spring Events, SSE
- 사용자가 상품을 신고하면 Report 데이터가 PENDING 상태로 생성되고, 관리자에게 SSE 알림이 갑니다. 관리자가 신고를 '승인'하면, Product 엔티티는 물리적으로 삭제되지 않고 status가 DELETED로 변경되는 Soft Delete 방식이 적용됩니다. 처리 결과는 신고자와 판매자 모두에게 SSE 알림으로 전송됩니다.

<br><br>

### 16. 관리자 페이지 & 상품 강제 삭제
![Image](https://github.com/user-attachments/assets/88863d80-689b-4388-bccb-7f3a2df2a199)

- Spring Security (Role-based Access Control), QueryDSL
- /api/v1/admin/** 경로에 대한 접근은 SecurityConfig에서 hasRole("ADMIN")으로 설정하여 관리자만 접근 가능하도록 보호합니다. 관리자는 QueryDSL을 통해 구현된 사용자/상품 검색 기능을 사용하여 데이터를 관리하고, 문제가 있는 상품을 Soft Delete 처리할 수 있습니다.

<br><br>

### 17. 상품 검색 & 필터링
![Image](https://github.com/user-attachments/assets/3a2cd59b-78b2-4721-a392-e8c3d23d438d)

- QueryDSL, BooleanExpression
- ProductRepositoryImpl에서 QueryDSL을 사용하여, 사용자가 입력한 여러 검색 조건(키워드, 카테고리, 가격 범위 등)을 BooleanExpression으로 조합합니다. 값이 있는 조건만 where 절에 동적으로 추가되므로, 복잡한 검색 요구사항을 효율적인 단일 메소드로 처리합니다.

<br><br>

### 18. 마이페이지
![Image](https://github.com/user-attachments/assets/f8698765-439d-4dfb-9b89-b2ceafbd2fb1)

- REST API, JPA (Query Method)
- 구매/판매/입찰/정산/리뷰 등 각 탭에 해당하는 데이터를 UserRepository, PaymentRepository 등에 정의된 다양한 JPA 쿼리 메소드를 통해 조회합니다. 각 API는 현재 인증된 사용자(@AuthenticationPrincipal)의 ID를 기준으로 데이터를 필터링하여 반환합니다.

<br><br>

## ✨ 주요 기능 상세 설명 (Detailed Features)

### 1. 실시간 경매 시스템
#### 🔹 실시간 입찰 및 가격 전파
- **기술**: Spring WebSocket (STOMP 프로토콜), stompjs (클라이언트)  
- **구현**:  
  - 사용자가 상품 상세 페이지에 진입하면 WebSocket 연결을 맺고 특정 상품 채널(`/sub/products/{productId}`)을 구독합니다.  
  - 사용자가 입찰하면(`/pub/products/{productId}/bids`), `AuctionService`는 **비관적 락(Pessimistic Lock)** 으로 상품 데이터의 동시 수정을 방지하며 입찰을 처리합니다.  
  - 성공 시, 갱신된 최고가와 입찰자 정보를 해당 채널을 구독 중인 모든 클라이언트에게 브로드캐스팅하여 실시간으로 화면을 동기화합니다.

#### 🔹 자동 입찰
- **기술**: JPA, Transactional 로직  
- **구현**:  
  - 사용자가 최대 입찰 금액을 미리 설정하면 `AutoBid` 테이블에 저장됩니다.  
  - 새로운 입찰이 발생할 때마다 `AuctionService`의 `processAutoBids` 메서드가 트리거되어, 해당 상품의 모든 자동 입찰 설정을 조회합니다.  
  - 현재 최고 입찰자와 2순위 자동 입찰자의 최대 금액을 비교하여, 시스템이 최소 입찰 단위만큼 자동으로 가격을 올려 경쟁적으로 입찰을 진행합니다.

#### 🔹 경매 시간 자동 연장
- **기술**: `java.time.Duration`  
- **구현**:  
  - `AuctionService.placeBid` 메서드 내에서, 경매 마감 60초 이내에 새로운 입찰이 발생하면 `product.extendAuctionEndTime()`을 호출하여 마감 시간을 `현재 시간 + 60초`로 동적으로 연장합니다.  
  - 이를 통해 마감 직전의 치열한 입찰 경쟁을 공정하게 보장합니다.

---

### 2. 사용자 상호작용 및 편의 기능
#### 🔹 실시간 알림 (SSE)
- **기술**: Spring `SseEmitter`, EventSource (클라이언트)  
- **구현**:  
  - 사용자가 로그인하면 `/api/v1/subscribe` 엔드포인트를 통해 서버와 단방향 SSE 연결을 맺습니다.  
  - 서버에서는 입찰, 낙찰, 채팅, 신고 처리 등 주요 이벤트 발생 시, `@TransactionalEventListener`를 사용하여 **트랜잭션이 성공적으로 완료된 후**에만 `NotificationEvent`를 발행합니다.  
  - `NotificationService`는 이 이벤트를 받아 해당 사용자에게 실시간으로 알림 데이터를 전송하여 프론트엔드에서 팝업(Toast)을 띄웁니다.

#### 🔹 실시간 채팅
- **기술**: Spring WebSocket (STOMP), stompjs  
- **구현**:  
  - 사용자가 '채팅하기'를 누르면, 백엔드는 해당 상품과 구매 희망자에 대한 `ChatRoom`을 조회하거나 생성합니다.  
  - 채팅방에 입장하면 `/sub/chat/rooms/{roomId}`를 구독하고, 메시지를 보낼 때는 `/pub/chat/rooms/{roomId}/message`로 발행합니다.  
  - `ChatService`는 메시지를 DB에 저장하고, 상대방에게는 실시간 SSE 알림을 보내 새 메시지 도착을 알려줍니다.

#### 🔹 키워드 알림
- **기술**: JPQL (LIKE 연산)  
- **구현**:  
  - `ProductService.createProduct` 메서드에서 상품이 저장된 후, 상품명과 설명을 합친 텍스트를 `keywordRepository.findUsersByKeywordIn()`으로 전달합니다.  
  - 이 JPQL 쿼리는 `LIKE '%keyword%'` 조건을 사용하여 등록된 키워드를 포함하는지 검사하고, 알림을 받을 모든 사용자를 찾아 `NotificationEvent`를 발행합니다.

---

### 3. 안정적인 데이터 처리 및 관리
#### 🔹 결제 시스템 연동
- **기술**: Toss Payments API, `RestTemplate`  
- **구현**:  
  - 사용자가 '결제하기'를 누르면, `PaymentService`는 먼저 DB에 **PENDING** 상태의 `Payment` 레코드를 생성하고 주문 ID를 발급합니다.  
  - 프론트엔드는 이 정보로 토스 결제 위젯을 띄우고, 결제 성공 후 `paymentKey`를 받아 백엔드의 `/payments/confirm`으로 최종 승인을 요청합니다.  
  - 서버는 이 요청을 받아 토스 서버와 `RestTemplate`으로 통신하여 결제를 검증하고 최종 완료 처리합니다.

#### 🔹 Soft Delete 기반 상품 관리
- **기술**: JPA, Enum 상태 관리, Repository 계층 필터링  
- **구현**:  
  - 상품을 실제로 삭제하는 대신 `ProductStatus` Enum에 `DELETED` 상태를 추가하고, `product.softDelete()`를 통해 상태만 변경합니다.  
  - `@SQLRestriction`의 유연성 문제를 해결하기 위해 해당 어노테이션을 제거하고, 대신 `ProductRepository`의 QueryDSL 조회 로직에서 기본적으로 `status <> 'DELETED'` 조건을 추가했습니다.  
  - 이를 통해 관리자는 모든 상품을 조회할 수 있고, 일반 사용자는 삭제된 상품을 볼 수 없도록 유연하게 제어합니다.

#### 🔹 상세 검색 및 필터링
- **기술**: QueryDSL, `BooleanExpression`  
- **구현**:  
  - `ProductRepositoryImpl`에서 QueryDSL을 사용하여 `ProductSearchCondition` DTO에 담겨온 여러 검색 조건(키워드, 카테고리, 가격, 상태 등)을 `BooleanExpression`으로 조합합니다.  
  - 값이 있는 조건만 where 절에 동적으로 추가되므로, 다양한 검색 시나리오에 대응하는 단일 메소드로 효율적인 검색 기능을 구현했습니다.

<br>

## 🛠️ 기술 스택 (Tech Stack)

### Backend
-   **Framework**: Spring Boot 3.x
-   **Language**: Java 17
-   **Database**: Spring Data JPA, MariaDB
-   **Query**: QueryDSL (동적 쿼리)
-   **Real-time**: Spring WebSocket (STOMP), Server-Sent Events (SSE)
-   **Security**: Spring Security, JWT (Access/Refresh Token), OAuth2 (Google Login)
-   **Cache & Data Store**: Redis (사용자 정보 캐싱, Refresh Token 저장)
-   **Build Tool**: Gradle
-   **API Test**: JUnit 5, Mockito, Spring Boot Test

### Frontend
-   **Framework**: React (with TypeScript)
-   **State Management**: Zustand (Hook 기반 경량 상태 관리)
-   **API Client**: Axios (인터셉터를 통한 자동 토큰 재발급 구현)
-   **Styling**: Tailwind CSS
-   **Real-time Client**: `@stomp/stompjs`, `sockjs-client`, `EventSource`
-   **UI/UX**: `react-hot-toast` (실시간 알림), `react-responsive-carousel`, `react-chartjs-2`

### Infrastructure & DevOps
-   **Cloud Provider**: Oracle Cloud Infrastructure (OCI)
-   **Containerization**: Docker, Docker Compose
-   **Web Server / Proxy**: Nginx (리버스 프록시 및 React 정적 파일 서빙)
-   **CI/CD**: GitHub Actions
-   **Image Registry**: Docker Hub

<br>

## 🏛️ 시스템 아키텍처 (System Architecture)

<p align="center">
  <!-- TODO: 아키텍처 다이어그램 이미지를 추가하세요. -->
<!--   <img width="3840" height="3090" alt="Image" src="https://github.com/user-attachments/assets/b1d91c12-a0ce-4274-bd48-461f576e997c" /> -->
  <img width="1724" height="3840" alt="Image" src="https://github.com/user-attachments/assets/b5d81f98-4aff-4c72-8e73-867cd097e28f" />
</p>

1.  **사용자**: 웹 브라우저를 통해 `upbid.duckdns.org` 도메인으로 서비스에 접속합니다.
2.  **Frontend (Nginx + React)**: OCI 서버의 Nginx 컨테이너가 사용자의 요청을 가장 먼저 받습니다. Nginx는 빌드된 React 정적 파일(HTML, CSS, JS)을 사용자에게 제공하여 화면을 렌더링합니다.
3.  **Reverse Proxy**: 사용자의 모든 API 요청(예: `/api/v1`, `/oauth2`), WebSocket(`ws-stomp`), SSE(`subscribe`) 요청은 Nginx의 리버스 프록시 설정을 통해 내부 네트워크에 있는 백엔드(Spring Boot) 컨테이너로 안전하게 전달됩니다.
4.  **Backend (Spring Boot)**: 비즈니스 로직을 처리하고, 필요에 따라 데이터베이스(MariaDB)와 캐시/데이터 저장소(Redis)와 통신합니다. 모든 컨테이너는 Docker의 내부 네트워크를 통해 서비스 이름으로 서로를 찾아 통신합니다.
5.  **Database (MariaDB)**: 모든 영구 데이터(사용자, 상품, 거래 내역 등)를 저장합니다. 데이터는 호스트 서버의 볼륨에 마운트되어 컨테이너가 재시작되어도 유실되지 않습니다.
6.  **Cache & Store (Redis)**: 자주 조회되는 사용자 인증 정보 캐싱, Refresh Token 저장 등 빠른 데이터 접근이 필요한 경우에 사용됩니다.

<br>

## 🚀 배포 및 CI/CD (Deployment & CI/CD)

본 프로젝트는 `git push` 명령 한 번으로 빌드부터 테스트, 운영 서버 배포까지 모든 과정이 자동으로 이루어지는 CI/CD 파이프라인을 구축했습니다. 이를 통해 개발자는 코드 작성에만 집중할 수 있으며, 배포 과정에서의 실수를 원천 차단하고 안정적인 서비스 운영을 보장합니다.

### CI/CD 파이프라인 흐름

1.  **Trigger (GitHub)**: 개발자가 로컬에서 작업한 코드를 `dev` 브랜치에 `push`하면, GitHub Actions 워크플로우가 자동으로 실행됩니다.
2.  **Build (GitHub Actions)**:
  -   GitHub Actions의 가상 머신(Ubuntu) 환경에서 소스 코드를 체크아웃합니다.
  -   `Dockerfile`을 기반으로 **Backend(Spring Boot)**와 **Frontend(React)** 프로젝트를 각각 빌드하여 운영 환경용 Docker 이미지를 생성합니다. 이 과정에서 프론트엔드는 운영용 환경 변수(`.env.production`)를 사용하여 API 주소를 올바르게 설정합니다.
3.  **Push to Registry (Docker Hub)**:
  -   성공적으로 빌드된 두 개의 Docker 이미지는 버전 관리를 위해 고유한 Git Commit Hash 태그와 `latest` 태그가 부여되어 Docker Hub 개인 리포지토리에 업로드(push)됩니다.
4.  **Deploy (GitHub Actions & OCI)**:
  -   이미지 푸시가 완료되면, GitHub Actions는 SSH를 통해 Oracle Cloud에 배포된 운영 서버에 안전하게 접속합니다.
  -   서버에서 배포 스크립트를 실행하여 다음 작업을 수행합니다.
    -   최신 설정 파일(`docker-compose.yml` 등)을 `git pull`로 동기화합니다.
    -   GitHub Secrets에 저장된 환경 변수로 `.env` 파일을 생성합니다.
    -   Docker Hub에서 방금 업로드된 최신 버전의 이미지를 다운로드(`docker-compose pull`)합니다.
    -   `docker-compose up -d` 명령으로 기존 컨테이너를 중단 없이 새로운 버전의 컨테이너로 교체하여 애플리케이션을 재시작합니다.
    -   구버전의 불필요한 Docker 이미지를 삭제하여 서버 용량을 관리합니다.

### 주요 설정 및 구현 내용

#### 🔹 환경 분리 (Development vs. Production)
-   **Spring Boot Profile**: `application.yml` (공통), `application-prod.yml` (운영)을 분리하여 환경별 설정을 관리합니다.
-   **Docker Compose Override**: `docker-compose.yml` (공통/서버), `docker-compose.override.yml` (로컬 전용)을 사용하여, 서버의 절대 경로 볼륨 설정이 로컬 환경에 영향을 주지 않도록 구현했습니다.
-   **React `.env` 파일**: `.env.local` (로컬)과 `.env.production` (운영) 파일을 통해 API 요청 주소를 환경에 따라 동적으로 설정합니다.

#### 🔹 Nginx 리버스 프록시
-   `nginx.conf`에 `location` 블록을 상세히 설정하여, 사용자의 모든 요청을 단일 도메인으로 받습니다.
-   `/api/v1`, `/oauth2`, `/login/oauth2`, `/ws-stomp`, `/images` 등 백엔드로 전달되어야 할 모든 경로를 명시적으로 `proxy_pass` 처리하여, React Router와의 경로 충돌 문제를 해결했습니다.
-   SSE(Server-Sent Events) 연결의 실시간성을 보장하기 위해 `proxy_buffering off` 등의 헤더를 추가했습니다.

#### 🔹 CI/CD 워크플로우 (`.github/workflows/deploy.yml`)
-   `build-and-push`와 `deploy` 두 개의 잡(Job)으로 파이프라인을 구성하여 역할을 명확히 분리했습니다.
-   `appleboy/ssh-action`, `docker/build-push-action` 등 검증된 GitHub Actions 마켓플레이스 액션을 활용하여 파이프라인을 안정적이고 효율적으로 구축했습니다.
-   API 키, 서버 접속 정보 등 모든 민감 정보는 GitHub Secrets에 안전하게 저장하여 코드 노출을 방지했습니다.

<br>

## 📊 ERD (Entity Relationship Diagram)

<img width="3840" height="1369" alt="Image" src="https://github.com/user-attachments/assets/0954fece-fee6-407e-851f-b532f946cf64" />

<br>

## 🌟 트러블슈팅 및 주요 구현 내용

### 1. 경매 입찰 시 발생하는 동시성(Concurrency) 문제 해결
- **문제**:  
  여러 사용자가 동시에 같은 상품에 입찰을 시도할 경우, 데이터베이스 경합(Race Condition)이 발생할 수 있었습니다.  
  예를 들어, 두 사용자가 거의 동시에 현재가 1,000원을 보고 1,100원을 입찰하면, 두 입찰 모두 유효한 것으로 처리되어 데이터의 정합성이 깨지거나, 한쪽의 입찰이 누락되는 문제가 발생할 수 있었습니다.

- **해결**:  
  JPA의 **비관적 락(Pessimistic Lock)** 을 도입했습니다.  
  - `AuctionService.placeBid` 메서드에서 상품 조회 시 `@Lock(LockModeType.PESSIMISTIC_WRITE)`을 사용하도록 `ProductRepository`에 메서드를 추가.  
  - 한 사용자의 입찰 트랜잭션이 특정 상품(Product) row에 접근하면, DB 레벨에서 `SELECT ... FOR UPDATE` 쿼리를 통해 쓰기 락을 설정.  
  - 다른 사용자의 트랜잭션은 락이 해제될 때까지 대기.  
  - 이를 통해 **한 번에 하나의 스레드만 입찰 로직 실행**이 가능해져 데이터 부정합 문제를 원천 차단.

---

### 2. 복잡한 자동 입찰(Auto-Bidding) 경쟁 로직 구현
- **문제**:  
  단순 최고가 갱신을 넘어, 다수의 자동 입찰자와 일반 입찰자가 섞여 경쟁하는 시나리오를 안정적으로 처리해야 했습니다.  
  예시:  
  - A(최대 5,000원)  
  - B(최대 4,000원)  
  - C(일반 입찰 3,000원)  
  → B는 4,100원까지, A는 4,100원으로 선두 유지해야 하는 상황.

- **해결**:  
  `AuctionService`에 `processAutoBids` 메서드를 구현하여 자동 입찰 경쟁 로직을 중앙 관리.  

- **로직 흐름**:  
  1. 새로운 입찰 발생 시 `processAutoBids` 호출.  
  2. 해당 상품의 모든 자동 입찰 목록을 **최대 금액 내림차순**으로 조회.  
  3. 현재 최고 입찰자와 1·2순위 자동 입찰자 상태 비교.  
  4. **다음 입찰가** =  
     - `(경쟁자의 최대 입찰가 + 최소 입찰 단위)`  
     - `(나의 최대 입찰가)`  
     - 중 **더 낮은 금액** 선택.  
  5. 계산된 금액으로 입찰 후 WebSocket으로 가격 변동 전파.  
  6. 경쟁 구도가 바뀔 때마다 반복, 더 이상 가격 인상이 불가할 때 종료.  

---

### 3. 트랜잭션과 비동기 알림 처리의 분리
- **문제**:  
  - DB 변경과 알림 발송이 함께 일어나는 로직에서, 트랜잭션 커밋 전에 알림(SSE)이 발송되어 데이터 정합성 문제 발생.  
  - API 호출자의 보안 컨텍스트가 알림 발송 스레드에 전파되어 `Access Denied` 예외 발생.

- **해결**:  
  Spring Events와 **`@TransactionalEventListener`** 도입.  

- **구현 방식**:  
  1. 서비스(`AdminService`, `ProductService`)에서 DB 작업 완료 후 `ApplicationEventPublisher`로 알림 ID만 담은 `NotificationEvent` 발행.  
  2. `NotificationService`의 이벤트 리스너는  
     - `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`로 **트랜잭션 성공 후 실행** 보장.  
     - 새로운 트랜잭션(`propagation = REQUIRES_NEW`)에서 ID 기반으로 객체 재조회 후 알림 발송.  
  3. 이를 통해 트랜잭션·보안 컨텍스트 문제를 완벽히 해결.

---

### 4. Soft Delete 구현과 유연한 데이터 조회 문제 해결
- **문제**:  
  - 상품 삭제 시 `FOREIGN KEY` 제약 조건 위반 발생.  
  - 삭제된 상품 기록 추적 불가.  
  - 전역 필터(`@SQLRestriction`) 사용 시, 관리자 페이지에서 필요한 데이터도 조회 불가.

- **해결**:  
  - `@SQLRestriction` 제거.  
  - `ProductStatus` Enum에 `DELETED` 상태 추가.  
  - Soft Delete는 `product.softDelete()`로 상태만 변경.  
  - Repository(QueryDSL)에서 직접 필터링 로직 제어.  

- **조회 로직**:  
  - 일반 사용자: `status <> 'DELETED'` 기본 조건 적용.  
  - 관리자: 조회할 모든 `status` 목록을 전달받아 `DELETED` 포함 조회 가능.  

---

### 5. Axios 인터셉터를 활용한 자동 토큰 재발급
- **문제**:  
  Access Token(30분) 만료 시, 사용자가 다시 로그인해야 하는 불편함.

- **해결**:  
  Axios **응답 인터셉터(Response Interceptor)** 로 자동 재발급 구현.  

- **동작 방식**:  
  1. 모든 API 응답 감시, `401 Unauthorized` 발생 시 요청 보류.  
  2. Refresh Token으로 `/api/v1/auth/reissue` 호출.  
  3. 새 Access Token 발급 시:  
     - 전역 상태(Zustand) & `localStorage` 업데이트.  
     - 실패했던 요청에 새 토큰을 담아 재전송.  
  4. 사용자 모르게 백그라운드에서 처리 → 매끄러운 UX 제공.
