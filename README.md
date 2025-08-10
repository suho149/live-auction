# 🚀 Real-Time Auction (실시간 경매 웹 애플리케이션)

<br>

<p align="center">
  <img src="https" width="800" alt="Project Banner">
  <!-- TODO: 프로젝트를 잘 나타내는 배너 이미지나 GIF를 추가하세요. -->
</p>

<br>

## 📖 프로젝트 소개 (Introduction)

**Real-Time Auction**은 WebSocket 기술을 기반으로 사용자들이 실시간으로 경매에 참여하고 소통할 수 있는 동적인 웹 애플리케이션입니다. 상품을 등록하여 판매하고, 원하는 상품에 입찰하거나 즉시 구매하며, 판매자와 실시간으로 채팅하는 등 경매의 모든 과정을 웹에서 경험할 수 있도록 구현했습니다.

이 프로젝트는 최신 백엔드 및 프론트엔드 기술 스택을 적용하여 높은 수준의 동시성 처리 능력과 안정성, 그리고 확장성을 목표로 설계되었습니다.

<br>

## ✨ 주요 기능 (Key Features)

-   **실시간 경매**: WebSocket(STOMP)을 통한 실시간 입찰 및 가격 업데이트
-   **자동 입찰**: 사용자가 설정한 최대 금액 내에서 시스템이 자동으로 입찰 진행
-   **경매 시간 자동 연장**: 마감 직전 입찰 시 경매 시간이 자동으로 연장되어 공정한 경쟁 유도
-   **즉시 구매**: 판매자가 설정한 즉시 구매가로 즉시 낙찰 가능
-   **실시간 채팅**: 상품에 대해 판매자와 구매 희망자 간의 1:1 실시간 채팅 기능
-   **실시간 알림**: SSE(Server-Sent Events)를 통한 개인화된 실시간 알림 (입찰, 낙찰, 채팅, 키워드, 배송 등)
-   **키워드 알림**: 관심 키워드를 등록하면 관련 상품 등록 시 즉시 알림 수신
-   **결제 시스템 연동**: Toss Payments API를 연동한 안전한 결제 처리
-   **배송 및 정산 시스템**: 결제 완료 후 배송 상태 추적 및 판매자 정산 관리 기능
-   **Soft Delete 기반 상품 관리**: 관리자에 의한 상품 삭제 시에도 데이터 보존 및 추적 가능
-   **상세 검색 및 필터링**: QueryDSL을 이용한 다중 조건(키워드, 카테고리, 가격, 상태) 상품 검색
-   **관리자 대시보드**: 서비스 현황(가입자, 거래액) 시각화 및 사용자/상품/신고/정산 관리 기능

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
-   **Containerization**: Docker, Docker Compose
-   **Web Server**: Nginx (리버스 프록시 및 React 정적 파일 서빙)
-   **CI/CD**: GitHub Actions (구현 예정)

<br>

## 🏛️ 시스템 아키텍처 (System Architecture)

<p align="center">
  <img src="https" width="800" alt="System Architecture Diagram">
  <!-- TODO: 아키텍처 다이어그램 이미지를 추가하세요. -->
</p>

```
graph TD
    subgraph "User's Browser"
        A[React Application]
    end

    subgraph "Web Server (Docker Container)"
        B[Nginx Reverse Proxy]
    end

    subgraph "Application Server (Docker Container)"
        C[Spring Boot Backend]
    end
    
    subgraph "Data Layer (Docker Containers)"
        D[MariaDB Database]
        E[Redis Cache & Store]
    end

    A -- "HTTP/HTTPS (Port 3000)" --> B;
    B -- "/api, /images (Proxy Pass)" --> C;
    B -- "/ws-stomp (WebSocket Proxy)" --> C;
    C -- "Real-time Bids/Chats" <--> A;
    C -- "Real-time Notifications (SSE)" --> A;
    C -- "JPA / QueryDSL" --> D;
    C -- "Cache / Refresh Token" --> E;
```

1.  **사용자**: 웹 브라우저를 통해 프론트엔드 서버(Nginx)에 접속합니다.
2.  **Frontend (Nginx + React)**: Nginx는 빌드된 React 정적 파일을 서빙합니다.
3.  **Proxy**: 사용자의 모든 API 요청 (`/api/...`, `/ws-stomp/...`)은 Nginx 리버스 프록시를 통해 백엔드 서버로 전달됩니다.
4.  **Backend (Spring Boot)**: 비즈니스 로직을 처리하고, 필요에 따라 데이터베이스(MariaDB)와 캐시/데이터 저장소(Redis)와 통신합니다.
5.  **Database (MariaDB)**: 모든 영구 데이터(사용자, 상품, 거래 내역 등)를 저장합니다.
6.  **Cache & Store (Redis)**: 자주 조회되는 사용자 인증 정보를 캐싱하고, Refresh Token을 저장하여 시스템 성능과 보안을 강화합니다.
7.  **실시간 통신**: WebSocket과 SSE 연결은 Nginx를 통해 백엔드 서버와 직접 수립됩니다.

<br>

## 📊 ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    User {
        Long id PK
        String name
        String email UK
        Role role
    }
    Product {
        Long id PK
        String name
        ProductStatus status
        Long seller_id FK
        Long highest_bidder_id FK
    }
    Bid { Long id PK, Long product_id FK, Long bidder_id FK }
    Payment { Long id PK, Long product_id FK, Long buyer_id FK }
    Delivery { Long id PK, Long payment_id FK }
    Settlement { Long id PK, Long payment_id FK, Long seller_id FK }
    Review { Long id PK, Long product_id FK, Long reviewer_id FK, Long reviewee_id FK }
    Question { Long id PK, Long product_id FK, Long author_id FK }
    Report { Long id PK, Long product_id FK, Long reporter_id FK }
    Like { Long id PK, Long user_id FK, Long product_id FK }
    Keyword { Long id PK, Long user_id FK }
    Notification { Long id PK, Long user_id FK }
    ChatRoom { Long id PK, Long product_id FK, Long buyer_id FK }
    ChatMessage { Long id PK, Long chat_room_id FK, Long sender_id FK }

    User ||--o{ Product : "판매"
    User ||--o{ Bid : "입찰"
    User ||--o{ Payment : "구매"
    User ||--o{ Review : "작성"
    User ||--o{ Review : "평가받음"
    User ||--o{ Question : "질문"
    User ||--o{ Report : "신고"
    User ||--o{ Like : "찜하기"
    User ||--o{ Keyword : "등록"
    User ||--o{ Notification : "알림받음"
    User ||--o{ ChatRoom : "채팅"
    User ||--o{ ChatMessage : "메시지보냄"
    User ||--o{ Settlement : "정산받음"
    Product ||--o{ Bid : "대상"
    Product ||--o{ Payment : "결제대상"
    Product ||--o{ Review : "관련"
    Product ||--o{ Question : "관련"
    Product ||--o{ Report : "대상"
    Product ||--o{ Like : "대상"
    Product ||--o{ ChatRoom : "관련"
    Payment ||--o{ Delivery : "배송정보"
    Payment ||--o{ Settlement : "정산정보"
    ChatRoom ||--o{ ChatMessage : "메시지포함"
```
