import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance, { API_BASE_URL } from '../api/axiosInstance'; // API_BASE_URL import
import Header from '../components/Header';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Carousel } from 'react-responsive-carousel';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline'; // 찜 아이콘
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import {ChatBubbleLeftRightIcon, EllipsisVerticalIcon} from "@heroicons/react/16/solid";
import AlertModal from "../components/AlertModal";
import useAuthStore from '../hooks/useAuthStore';

type ProductStatus = 'ON_SALE' | 'AUCTION_ENDED' | 'SOLD_OUT' | 'EXPIRED' | 'FAILED';

// 타입 정의: imageUrl -> imageUrls (문자열 배열)로 변경
interface ProductDetail {
    id: number;
    name: string;
    description: string;
    currentPrice: number;
    imageUrls: string[]; // 다중 이미지를 위한 배열
    category: string; // 카테고리 추가
    auctionEndTime: string;
    sellerName: string;
    sellerId: number;
    sellerProfileImageUrl: string | null;
    sellerRating: number;
    sellerSalesCount: number;
    highestBidderName: string;
    likeCount: number;
    likedByCurrentUser: boolean; // 현재 사용자가 찜했는지 여부
    status: ProductStatus;
    paymentDueDate: string | null;
    buyNowPrice: number | null;
    myAutoBidMaxAmount: number | null;
    participantCount: number;
}

interface BidResponse {
    productId: number;
    newPrice: number;
    bidderName: string;
    auctionEndTime: string;
}

declare global {
    interface Window {
        PaymentWidget?: any; // 간단하게 any 타입으로 선언
    }
}

// 수정 모달을 위한 타입 추가
interface ProductUpdateRequest {
    name: string;
    description: string;
    category: string;
}

// 카테고리 상수
const categories = ["DIGITAL_DEVICE", "APPLIANCES", "FURNITURE", "HOME_LIFE", "CLOTHING", "BEAUTY", "SPORTS_LEISURE", "BOOKS_TICKETS", "PET_SUPPLIES", "ETC"];
const categoryKoreanNames: { [key: string]: string } = {
    DIGITAL_DEVICE: "디지털 기기", APPLIANCES: "생활가전", FURNITURE: "가구/인테리어", HOME_LIFE: "생활/주방", CLOTHING: "의류", BEAUTY: "뷰티/미용", SPORTS_LEISURE: "스포츠/레저", BOOKS_TICKETS: "도서/티켓/음반", PET_SUPPLIES: "반려동물용품", ETC: "기타 중고물품"
};

// 토스페이먼츠 위젯 타입을 명시적으로 선언
interface TossPaymentWidget {
    renderPaymentMethods: (selector: string, amount: { value: number }, options?: { variantKey?: string }) => void;
    requestPayment: (paymentInfo: any) => void;
}

// 백엔드로부터 받는 결제 정보 타입
interface PaymentInfo {
    orderId: string;
    productName: string;
    amount: number;
    buyerName: string;
    buyerEmail: string;
}

const ProductDetailPage = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [bidAmount, setBidAmount] = useState<number>(0);
    const stompClient = useRef<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { isLoggedIn, userInfo } = useAuthStore();

    // --- 상태 관리 재구성 ---
    const [timeLeft, setTimeLeft] = useState("");
    const [paymentTimeLeft, setPaymentTimeLeft] = useState("");

    // --- UI 상태 관리 ---
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ name: '', description: '', category: 'ETC' });
    const [alertInfo, setAlertInfo] = useState({ isOpen: false, title: '', message: '' });
    const [paymentInfo, setPaymentInfo] = useState<any>(null); // 타입 확장성 위해 any
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const paymentWidgetRef = useRef<any>(null);

    const [isAutoBidModalOpen, setIsAutoBidModalOpen] = useState(false);
    const [autoBidAmount, setAutoBidAmount] = useState<number>(0);

    // 1. product 상태를 항상 최신으로 참조하기 위한 ref 생성
    const productRef = useRef<ProductDetail | null>(product);
    useEffect(() => {
        productRef.current = product;
    }, [product]);

    // --- 공통 함수 ---
    const showAlert = (title: string, message: string) => setAlertInfo({ isOpen: true, title, message });

    // 2. 상품 데이터 로딩 함수 및 useEffect
    const fetchProduct = async () => {
        try {
            const response = await axiosInstance.get<ProductDetail>(`/api/v1/products/${productId}`);
            setProduct(response.data);
            if (response.data.status === 'ON_SALE') {
                setBidAmount(response.data.currentPrice + 1000);
            }
            setEditFormData({
                name: response.data.name,
                description: response.data.description,
                category: response.data.category,
            });
        } catch (error) {
            console.error("상품 정보 로딩 실패:", error);
            showAlert("오류", "상품 정보를 불러올 수 없습니다.");
            navigate('/');
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [productId]);

    // ★ 3. 타이머 통합 관리 useEffect (ref 사용으로 수정)
    useEffect(() => {
        const timer = setInterval(() => {
            const currentProduct = productRef.current;
            if (!currentProduct) return;

            if (currentProduct.status === 'ON_SALE') {
                const endTime = new Date(currentProduct.auctionEndTime).getTime();
                if (endTime < Date.now()) {
                    setTimeLeft("경매 종료 처리 중...");
                    setTimeout(() => fetchProduct(), 2000);
                    clearInterval(timer);
                } else {
                    const distance = endTime - Date.now();
                    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    setTimeLeft(`${days}일 ${hours}시간 ${minutes}분 ${seconds}초 남음`);
                }
            }

            if (currentProduct.status === 'AUCTION_ENDED' && currentProduct.paymentDueDate) {
                const endTime = new Date(currentProduct.paymentDueDate).getTime();
                if (endTime < Date.now()) {
                    setPaymentTimeLeft("결제 기한 만료");
                    setTimeout(() => fetchProduct(), 2000);
                    clearInterval(timer);
                } else {
                    const distance = endTime - Date.now();
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    setPaymentTimeLeft(`${hours}시간 ${minutes}분 ${seconds}초 내에 결제`);
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []); // 의존성 배열을 비워서 최초 1회만 실행

    // ★ 4. 웹소켓 연결 useEffect (의존성 수정)
    useEffect(() => {
        if (!isLoggedIn || !productId || !product || product.status !== 'ON_SALE') {
            if (stompClient.current?.active) stompClient.current.deactivate();
            return;
        }

        const token = localStorage.getItem('accessToken');
        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-stomp`),
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                setIsConnected(true);
                client.subscribe(`/sub/products/${productId}`, (message) => {
                    const bidResponse: BidResponse = JSON.parse(message.body);
                    setProduct(prev => prev ? {
                        ...prev,
                        currentPrice: bidResponse.newPrice,
                        highestBidderName: bidResponse.bidderName,
                        auctionEndTime: bidResponse.auctionEndTime
                    } : null);
                });
                client.subscribe('/user/queue/errors', (message) => showAlert('입찰 실패', message.body));
            },
            onDisconnect: () => setIsConnected(false),
            onStompError: (frame) => console.error('Broker error:', frame.headers['message']),
        });

        client.activate();
        stompClient.current = client;

        return () => {
            if (stompClient.current?.active) stompClient.current.deactivate();
        };
    }, [isLoggedIn, productId, product?.status]);


    // --- 핸들러 함수들 (handleBidSubmit 수정) ---
    const handleBidSubmit = () => {
        if (!isLoggedIn) { showAlert('로그인 필요', '로그인이 필요합니다.'); return; }
        if (product?.status !== 'ON_SALE') { showAlert('경매 종료', '이미 종료된 경매입니다.'); return; }
        if (!isConnected) { showAlert('연결 중', '경매 서버에 연결 중입니다.'); return; }
        if (!product || bidAmount <= product.currentPrice) { showAlert('입찰 오류', '현재가보다 높은 금액을 입력해야 합니다.'); return; }
        stompClient.current?.publish({
            destination: `/pub/products/${productId}/bids`,
            body: JSON.stringify({ bidAmount }),
        });
    };

    // 찜 버튼 클릭 핸들러
    const handleLikeClick = async () => {
        if (!isLoggedIn) {
            showAlert('로그인 필요', '로그인이 필요한 기능입니다.');
            return;
        }
        try {
            const response = await axiosInstance.post(`/api/v1/products/${productId}/like`);
            const { liked, likeCount } = response.data;
            // 화면에 즉시 반영
            setProduct(prev => prev ? { ...prev, likedByCurrentUser: liked, likeCount } : null);
        } catch (error) {
            console.error("찜하기 실패:", error);
        }
    };

    // 삭제 버튼 클릭 핸들러 (실제 삭제 로직 추가 필요)
    const handleDeleteClick = async () => {
        if (window.confirm("정말로 이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
            try {
                await axiosInstance.delete(`/api/v1/products/${productId}`);
                alert("상품이 삭제되었습니다.");
                navigate('/');
            } catch (error) {
                console.error("상품 삭제 실패:", error);
                showAlert('삭제 실패', '상품 삭제에 실패했습니다.');
            }
        }
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axiosInstance.put(`/api/v1/products/${productId}`, editFormData);
            showAlert('성공', '상품 정보가 성공적으로 수정되었습니다.');
            setIsEditModalOpen(false);
            window.location.reload(); // 가장 간단하게 변경사항을 반영하는 방법
        } catch (error: any) {
            console.error("상품 수정 실패:", error);

            // 서버로부터 받은 에러 메시지가 있다면 그것을 표시하고, 없다면 기본 메시지를 표시
            const errorMessage = error.response?.data?.message || "상품 수정에 실패했습니다. 다시 시도해주세요.";
            showAlert('수정 실패', errorMessage);
        }
    };

    const handleChatClick = async () => {
        try {
            const response = await axiosInstance.post(`/api/v1/chat/rooms/${productId}`);
            const roomId = response.data;
            navigate(`/chat/rooms/${roomId}`);
        } catch (error) {
            showAlert('채팅방 생성 실패', '채팅방을 만드는 데 실패했습니다.');
        }
    };

    // 드롭다운 메뉴 바깥을 클릭하면 메뉴가 닫히도록 하는 useEffect 추가
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        // 이벤트 리스너 등록
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            // 컴포넌트 언마운트 시 이벤트 리스너 제거
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuRef]);

    // 결제하기 버튼 클릭 핸들러
    const handlePaymentClick = async () => {
        // 로그 1: 버튼 클릭 시점의 모든 상태 확인
        console.group('--- [Debug] handlePaymentClick 시작 ---');
        console.log('Product:', product);
        console.log('UserInfo:', userInfo);
        console.log('isLoggedIn:', isLoggedIn);
        console.log('window.PaymentWidget 존재 여부:', !!window.PaymentWidget);
        console.groupEnd();

        if (!product || !userInfo) {
            showAlert('오류', '상품 또는 사용자 정보가 없습니다.');
            return;
        }

        if (!window.PaymentWidget) {
            showAlert('결제 시스템 오류', '결제 시스템이 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        try {
            const response = await axiosInstance.post(`/api/v1/payments/${productId}/info`);
            console.log('[Debug] 백엔드로부터 받은 결제 정보:', response.data);
            setPaymentInfo(response.data);
            setIsPaymentModalOpen(true);
        } catch (error) {
            console.error("결제 정보 생성 실패:", error);
            showAlert('결제 오류', '결제 정보를 생성하는 데 실패했습니다.');
        }
    };

    // 결제 위젯 렌더링을 위한 useEffect
    useEffect(() => {
        // 로그 2: 위젯 렌더링 useEffect 실행 시점의 상태 확인
        console.group('--- [Debug] 위젯 렌더링 useEffect 실행 ---');
        console.log('isPaymentModalOpen:', isPaymentModalOpen);
        console.log('paymentInfo:', paymentInfo);
        console.log('userInfo:', userInfo);
        console.log('window.PaymentWidget:', window.PaymentWidget);
        console.groupEnd();

        // 모달이 닫히거나, 필요한 정보가 없으면 실행하지 않음
        if (!isPaymentModalOpen || !paymentInfo || !userInfo || !window.PaymentWidget) {
            return;
        }

        try {
            // 토스페이먼츠 개발자 센터에서 발급받은 'API 개별 연동 키'의
            // '클라이언트 키'를 다시 한번 정확하게 복사해서 붙여넣어 주세요.
            const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm"; // <--- 이 키를 재확인 & 교체
            const customerKey = paymentInfo.buyerEmail;

            console.log('[Debug] PaymentWidget 초기화 시도. ClientKey:', clientKey);

            const paymentWidget = window.PaymentWidget(clientKey, customerKey);
            paymentWidgetRef.current = paymentWidget;

            // renderPaymentMethods는 Promise를 반환하지 않으므로 .catch를 제거합니다.
            // 대신, 이 함수는 렌더링 실패 시 에러를 throw하므로, try...catch 블록으로 전체를 감쌉니다.
            paymentWidget.renderPaymentMethods(
                '#payment-widget',
                { value: paymentInfo.amount },
                { variantKey: "DEFAULT" }
            );

        } catch (error) {
            console.error('PaymentWidget 초기화 또는 렌더링 중 에러 발생:', error);
            showAlert('결제 시스템 오류', '결제 화면을 불러오는 중 에러가 발생했습니다.');
            setIsPaymentModalOpen(false); // 에러 발생 시 모달 닫기
        }

    }, [isPaymentModalOpen, paymentInfo, userInfo]);

    // 모달 안의 최종 결제 버튼 핸들러
    const handleFinalPayment = async () => {
        if (!paymentWidgetRef.current || !paymentInfo) {
            showAlert('결제 오류', '결제 정보가 올바르지 않습니다.');
            return;
        }
        try {
            console.log('[Debug] requestPayment 호출. paymentInfo:', paymentInfo);
            await paymentWidgetRef.current.requestPayment({
                orderId: paymentInfo.orderId,
                orderName: paymentInfo.productName,
                amount: paymentInfo.amount,
                customerName: paymentInfo.buyerName,
                successUrl: `${window.location.origin}/payment/success`,
                failUrl: `${window.location.origin}/payment/fail`,
            });
        } catch (error: any) {
            console.error("결제 요청 실패:", error);
            if (error.code && error.code !== 'USER_CANCEL') {
                showAlert('결제 실패', error.message || '결제 처리 중 오류가 발생했습니다.');
            }
        }
    };

    // 판매자 조기 종료 핸들러 함수 추가
    const handleEndAuctionEarly = async () => {
        if (window.confirm("정말로 경매를 지금 종료하시겠습니까? 현재 최고 입찰자가 낙찰됩니다. 이 작업은 되돌릴 수 없습니다.")) {
            try {
                await axiosInstance.post(`/api/v1/products/${productId}/end-auction`);
                showAlert('성공', '경매가 조기 종료되었습니다. 페이지를 새로고침합니다.');
                // 성공 시 window.location.reload()가 alertInfo.onClose에 의해 실행됨
            } catch (error: any) {
                const message = error.response?.data?.message || "경매 종료에 실패했습니다.";
                showAlert('오류', message);
            } finally {
                setIsMenuOpen(false); // 메뉴 닫기
            }
        }
    };

    const handleBuyNow = async () => {
        if (!product || !product.buyNowPrice) return;

        if (window.confirm(`${product.buyNowPrice.toLocaleString()}원에 즉시 구매하고 바로 결제를 진행하시겠습니까?`)) {
            try {
                // 1. [기존] 상태 변경 요청 -> [변경] 결제 정보 생성 요청
                const response = await axiosInstance.post<PaymentInfo>(`/api/v1/products/${productId}/buy-now/payment-info`);
                const paymentData = response.data;

                console.log('[Debug] 즉시 구매를 위한 결제 정보 수신:', paymentData);

                // 2. 받은 결제 정보를 state에 저장하고 결제 모달을 엶
                setPaymentInfo(paymentData);
                setIsPaymentModalOpen(true);

            } catch (error: any) {
                showAlert("실패", error.response?.data?.message || "즉시 구매 준비에 실패했습니다.");
            }
        }
    };

    const handleSetupAutoBid = async () => {
        // product가 null이면 아무것도 실행하지 않고 함수를 즉시 종료
        if (!product) {
            showAlert("오류", "상품 정보가 아직 로드되지 않았습니다.");
            return;
        }

        if (autoBidAmount <= product.currentPrice) {
            showAlert("오류", "최대 입찰가는 현재가보다 높아야 합니다.");
            return;
        }
        try {
            await axiosInstance.post(`/api/v1/products/${productId}/auto-bid`, { maxAmount: autoBidAmount });
            showAlert("성공", `${autoBidAmount.toLocaleString()}원으로 자동 입찰이 설정되었습니다.`);
            setIsAutoBidModalOpen(false);
        } catch (error: any) {
            showAlert("실패", error.response?.data?.message || "자동 입찰 설정에 실패했습니다.");
        }
    };

    const handleCancelAutoBid = async () => {
        if (window.confirm("자동 입찰 설정을 취소하시겠습니까?")) {
            try {
                await axiosInstance.delete(`/api/v1/products/${productId}/auto-bid`);
                showAlert("성공", "자동 입찰 설정을 취소했습니다.");
                fetchProduct(); // 최신 상태를 반영하기 위해 데이터 재요청
            } catch (error: any) {
                showAlert("실패", "자동 입찰 취소에 실패했습니다.");
            }
        }
    };

    // 결제 취소 핸들러 함수
    const handleCancelPayment = async () => {
        // 모달을 먼저 닫아 사용자에게 즉각적인 피드백을 줌
        setIsPaymentModalOpen(false);
        try {
            // 백엔드로 취소 API 호출 (성공/실패 여부를 굳이 기다릴 필요 없음 - "fire and forget")
            await axiosInstance.delete(`/api/v1/products/${productId}/payment`);
            console.log("결제 시도가 취소되었습니다.");
        } catch (error) {
            // 취소 실패는 사용자에게 굳이 알릴 필요는 없음. 서버에서 처리하도록 둠.
            console.error("결제 취소 API 호출 실패:", error);
        }
    };

    // 1. product가 null이면 로딩 화면을 먼저 렌더링
    if (!product) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <Header />
                <div className="flex justify-center items-center h-[50vh]">
                    <p>상품 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    // isSoldOut 변수를 선언하여 가독성 높임
    const isSoldOut = product.status === 'SOLD_OUT';

    // 5. 렌더링 시점마다 현재 사용자가 판매자인지 실시간으로 계산
    const isCurrentUserTheSeller = userInfo?.id === product.sellerId;

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-4 sm:p-8">
                <div className="bg-white p-6 rounded-lg shadow-lg grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    <div className="w-full">
                        <Carousel
                            showArrows={true}
                            autoPlay={false}
                            infiniteLoop={product.imageUrls.length > 1}
                            showThumbs={true}
                            thumbWidth={80}
                            className="product-carousel"
                        >
                            {product.imageUrls && product.imageUrls.length > 0 ? (
                                product.imageUrls.map((url, index) => (
                                    <div key={index}>
                                        <img src={`${API_BASE_URL}${url}`} alt={`${product.name} ${index + 1}`} />
                                    </div>
                                ))
                            ) : (
                                // 이미지가 없는 경우에도 배열 안에 요소를 넣어 반환
                                [
                                    <div key="no-image">
                                        <img src="https://placehold.co/600x400?text=No+Image" alt="기본 이미지" />
                                    </div>
                                ]
                            )}
                        </Carousel>
                    </div>

                    <div className="flex flex-col">
                        {/* 상단 정보 영역 */}
                        <div>
                            <span className="text-sm font-semibold text-blue-600">{categoryKoreanNames[product.category] || product.category}</span>

                            {/* 상품명과 버튼 그룹을 포함하는 Flex 컨테이너 */}
                            <div className="flex justify-between items-start my-3">
                                <h1 className="text-3xl lg:text-4xl font-bold mr-4 flex-grow">{product.name}</h1>

                                {/* 오른쪽 버튼 그룹 (찜하기, 채팅, 더보기) */}
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    {/* 판매 완료가 아닐 때만 버튼들을 보여줌 */}
                                    {!isSoldOut && (
                                        <>
                                            <button onClick={handleLikeClick} className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                                                {product.likedByCurrentUser ? <HeartIconSolid className="w-7 h-7 text-red-500"/> : <HeartIconOutline className="w-7 h-7"/>}
                                                <span className="font-semibold text-lg">{product.likeCount}</span>
                                            </button>

                                            {/* 구매 희망자에게 보이는 채팅하기 버튼 */}
                                            {isLoggedIn && !isCurrentUserTheSeller && (
                                                <button onClick={handleChatClick} className="bg-green-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm">
                                                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                                    <span>채팅하기</span>
                                                </button>
                                            )}

                                            {/* 판매자에게 보이는 더보기 버튼 */}

                                            {isLoggedIn && isCurrentUserTheSeller && product.status === 'ON_SALE' && (
                                                <div className="relative" ref={menuRef}>
                                                    <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-2 rounded-full hover:bg-gray-100">
                                                        <EllipsisVerticalIcon className="w-6 h-6 text-gray-600"/>
                                                    </button>
                                                    {isMenuOpen && (
                                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                                                            <button onClick={handleEndAuctionEarly} className="w-full text-left block px-4 py-2 text-sm text-orange-600 hover:bg-gray-100 font-semibold">경매 즉시 종료</button>
                                                            <button onClick={() => { setIsEditModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">상품 수정</button>
                                                            <button onClick={() => { handleDeleteClick(); setIsMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">상품 삭제</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 border-b pb-4 mb-4">
                                {/* 판매자 정보 */}
                                <div className="flex items-center mb-3">
                                    {/* 판매자 프로필 이미지 추가 */}
                                    <img
                                        // Google 프로필(http로 시작)과 로컬 업로드 이미지를 모두 처리
                                        src={
                                            product.sellerProfileImageUrl
                                                ? product.sellerProfileImageUrl.startsWith('http')
                                                    ? product.sellerProfileImageUrl
                                                    : `${API_BASE_URL}${product.sellerProfileImageUrl}`
                                                : 'https://placehold.co/48x48?text=S' // 기본 이미지
                                        }
                                        alt={product.sellerName}
                                        className="w-12 h-12 rounded-full object-cover mr-4 border" // mr-4로 오른쪽 여백 추가
                                    />
                                    <div className="flex-grow">
                                        <Link to={`/users/${product.sellerId}/profile`} className="font-semibold text-gray-800 hover:underline">
                                            {product.sellerName}
                                        </Link>
                                        <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                                            {/* 평점 표시 */}
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                <span>
                                            {product.sellerRating > 0 ? product.sellerRating.toFixed(1) : '평점 없음'}
                                        </span>
                                            </div>
                                            <span className="text-gray-300">|</span>
                                            <span>판매 {product.sellerSalesCount}회</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/*  참여자 수 표시 UI 추가 */}
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                    <span>참여 <span className="font-bold">{product.participantCount}</span>명</span>
                                </div>
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                                    <span>찜 <span className="font-bold">{product.likeCount}</span>개</span>
                                </div>
                            </div>

                            {/* 상태 표시 텍스트 */}
                            <p className={`text-lg font-bold mb-4 ${product.status === 'ON_SALE' ? 'text-green-600' : 'text-red-500'}`}>
                                {
                                    {
                                        'ON_SALE': timeLeft,
                                        'AUCTION_ENDED': paymentTimeLeft,
                                        'SOLD_OUT': '판매 완료',
                                        'EXPIRED': '결제 기한 만료',
                                        'FAILED': '유찰됨'
                                    }[product.status] || '상태 확인 중...'
                                }
                            </p>

                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                        </div>

                        {/* 하단 입찰/결제 영역 */}
                        <div className="mt-auto pt-4">
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-lg">현재 최고가</span>
                                    <span className="text-3xl font-bold text-red-500">{product.currentPrice.toLocaleString()}원</span>
                                </div>
                                <div className="text-right mt-1 text-sm text-gray-600">
                                    <span>입찰자: {product.highestBidderName}</span>
                                </div>
                            </div>

                            <div className="mt-4">
                                {(() => {
                                    switch (product.status) {
                                        case 'ON_SALE':
                                            if (!isLoggedIn) {
                                                return (
                                                    <div className="text-center p-3 bg-gray-200 rounded-md">
                                                        <p>입찰에 참여하려면 <a href={'http://localhost:8080/oauth2/authorization/google'} className="text-blue-600 font-bold hover:underline">로그인</a>이 필요합니다.</p>
                                                    </div>
                                                );
                                            }
                                            if (isCurrentUserTheSeller) {
                                                return (
                                                    <div className="text-center p-4 bg-yellow-100 text-yellow-800 rounded-md font-semibold">자신이 등록한 상품입니다.</div>
                                                );
                                            }
                                            // 입찰자일 경우 UI
                                            return (
                                                <div className="space-y-3">
                                                    {/* 1. 일반 입찰 폼 */}
                                                    <div className="flex space-x-2">
                                                        <input type="number" value={bidAmount} onChange={(e) => setBidAmount(parseInt(e.target.value, 10) || 0)} className="w-full p-3 border border-gray-300 rounded-md" placeholder="현재가보다 높은 금액"/>
                                                        <button onClick={handleBidSubmit} className="w-1/3 bg-blue-600 text-white font-bold p-3 rounded-md" disabled={!isConnected}>
                                                            {isConnected ? '입찰' : '연결 중'}
                                                        </button>
                                                    </div>

                                                    {/* 자동 입찰 상태 표시 UI */}
                                                    {product.myAutoBidMaxAmount ? (
                                                        // 자동 입찰이 설정된 경우
                                                        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                            <p className="text-sm text-blue-700">
                                                                자동 입찰이 <span className="font-bold">{product.myAutoBidMaxAmount.toLocaleString()}원</span>으로 설정되어 있습니다.
                                                            </p>
                                                            {/* 설정 변경을 위한 버튼을 여기에 추가할 수도 있음 */}
                                                            <button onClick={() => setIsAutoBidModalOpen(true)} className="text-xs text-blue-600 hover:underline mt-1">
                                                                금액 변경
                                                            </button>

                                                            <span className="text-gray-300">|</span>

                                                            <button onClick={handleCancelAutoBid} className="text-xs text-red-600 hover:underline font-semibold">
                                                                설정 취소
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        // 자동 입찰이 설정되지 않은 경우
                                                        <button
                                                            onClick={() => setIsAutoBidModalOpen(true)}
                                                            className="w-full text-sm text-blue-600 hover:text-blue-700 font-semibold py-2"
                                                        >
                                                            자동 입찰 설정하기
                                                        </button>
                                                    )}

                                                    {/* 3. 즉시 구매 버튼 */}
                                                    {product.buyNowPrice && product.buyNowPrice > product.currentPrice && (
                                                        <>
                                                            <div className="flex items-center">
                                                                <div className="flex-grow border-t"></div>
                                                                <span className="flex-shrink mx-4 text-gray-500 text-sm">또는</span>
                                                                <div className="flex-grow border-t"></div>
                                                            </div>
                                                            <button onClick={handleBuyNow} className="w-full bg-red-500 text-white font-bold py-3 rounded-md">
                                                                즉시 구매 ({product.buyNowPrice.toLocaleString()}원)
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            );

                                        case 'AUCTION_ENDED':
                                            if (isLoggedIn && product.highestBidderName === userInfo?.name) {
                                                if (paymentTimeLeft === "결제 기한 만료") {
                                                    return <div className="text-center p-4 bg-red-100 text-red-700 rounded-md font-bold">결제 기한이 만료되었습니다.</div>;
                                                }
                                                return <button onClick={handlePaymentClick} className="w-full bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700">결제하기</button>;
                                            }
                                            return <div className="text-center p-4 bg-gray-200 text-gray-600 rounded-md font-bold">경매가 종료되었습니다.</div>;

                                        case 'SOLD_OUT':
                                            return <div className="text-center p-4 bg-gray-200 text-gray-600 rounded-md font-bold">판매 완료된 상품입니다.</div>;

                                        case 'EXPIRED':
                                            return <div className="text-center p-4 bg-red-100 text-red-700 rounded-md font-bold">낙찰자가 기간 내에 결제하지 않았습니다.</div>;

                                        case 'FAILED':
                                            return <div className="text-center p-4 bg-gray-200 text-gray-600 rounded-md font-bold">입찰자 없이 경매가 종료되었습니다.</div>;

                                        default:
                                            return null;
                                    }
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* 결제 모달 UI */}
            {isPaymentModalOpen && paymentInfo && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                    onClick={handleCancelPayment} // 바깥 영역 클릭 시 취소
                >
                    <div
                        className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg"
                        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 이벤트 전파 방지
                    >
                        <h2 className="text-2xl font-bold mb-4">결제 진행</h2>

                        {/* 결제 위젯이 렌더링될 영역 */}
                        <div id="payment-widget"></div>

                        <div className="flex justify-end space-x-4 mt-8">
                            <button
                                type="button"
                                onClick={handleCancelPayment}
                                className="bg-gray-200 px-4 py-2 rounded-md"
                            >
                                취소
                            </button>

                            <button
                                type="button"
                                onClick={handleFinalPayment}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md"
                            >
                                {paymentInfo.amount.toLocaleString()}원 결제
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 상품 수정 모달 UI 추가 */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                        <h2 className="text-2xl font-bold mb-6">상품 정보 수정</h2>
                        <form onSubmit={handleUpdateSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">상품명</label>
                                <input type="text" id="edit-name" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                            </div>
                            <div>
                                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">상품 설명</label>
                                <textarea id="edit-description" rows={4} value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                            </div>
                            <div>
                                <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700">카테고리</label>
                                <select id="edit-category" value={editFormData.category} onChange={(e) => setEditFormData({...editFormData, category: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{categoryKoreanNames[cat]}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">취소</button>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">저장</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 자동 입찰 설정 모달 UI */}
            {isAutoBidModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-2">자동 입찰 설정</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            원하는 최대 입찰 금액을 입력하세요. 다른 사람이 입찰할 때마다 현재가보다 최소 단위만큼 높은 금액으로 시스템이 자동으로 입찰합니다.
                        </p>
                        <div className="mb-4">
                            <label htmlFor="autoBidAmount" className="block text-sm font-medium text-gray-700">최대 입찰가</label>
                            <input
                                type="number"
                                id="autoBidAmount"
                                value={autoBidAmount}
                                onChange={e => setAutoBidAmount(Number(e.target.value))}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                placeholder="현재가보다 높은 금액"
                            />
                        </div>
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => setIsAutoBidModalOpen(false)}
                                className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={handleSetupAutoBid}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                설정하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 알림 모달 컴포넌트 추가 */}
            <AlertModal
                isOpen={alertInfo.isOpen}
                onClose={() => {
                    setAlertInfo({ ...alertInfo, isOpen: false });
                    // 특정 alert 후 페이지 새로고침이 필요하다면 여기에 로직 추가
                    if (alertInfo.title === '성공') {
                        window.location.reload();
                    }
                }}
                title={alertInfo.title}
                message={alertInfo.message}
            />
        </div>
    );
};

export default ProductDetailPage;