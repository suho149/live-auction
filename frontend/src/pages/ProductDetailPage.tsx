import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    highestBidderName: string;
    likeCount: number;
    likedByCurrentUser: boolean; // 현재 사용자가 찜했는지 여부
    seller: boolean; // 현재 사용자가 판매자인지 여부
    status: ProductStatus;
    paymentDueDate: string | null;
}

interface BidResponse {
    productId: number;
    newPrice: number;
    bidderName: string;
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

    // --- UI 상태 관리 (변경 없음) ---
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ name: '', description: '', category: 'ETC' });
    const [alertInfo, setAlertInfo] = useState({ isOpen: false, title: '', message: '' });
    const [paymentInfo, setPaymentInfo] = useState<any>(null); // 타입 확장성 위해 any
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const paymentWidgetRef = useRef<any>(null);

    // --- 공통 함수 (변경 없음) ---
    const showAlert = (title: string, message: string) => setAlertInfo({ isOpen: true, title, message });

    // --- ★★★ 1. 상품 데이터 최초 로딩 및 재로딩을 위한 useEffect ★★★ ---
    const fetchProduct = async () => {
        try {
            const response = await axiosInstance.get<ProductDetail>(`/api/v1/products/${productId}`);
            setProduct(response.data);
            if(response.data.status === 'ON_SALE') {
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

    // --- 2. 타이머 통합 관리 useEffect (수정됨) ---
    useEffect(() => {
        // product 객체가 없으면 아무것도 실행하지 않음
        if (!product) return;

        // 1초마다 실행될 타이머 설정
        const timer = setInterval(() => {
            // --- 경매 타이머 로직 ---
            if (product.status === 'ON_SALE') {
                const endTime = new Date(product.auctionEndTime).getTime();
                const now = Date.now();

                if (endTime < now) {
                    // 경매 시간이 지났을 경우
                    setTimeLeft("경매 종료 처리 중...");
                    // 2초 후 서버로부터 최신 상태를 다시 가져와 UI를 업데이트
                    setTimeout(() => fetchProduct(), 2000);
                    clearInterval(timer); // 타이머 정리
                } else {
                    // 경매가 진행 중일 경우 남은 시간 계산
                    const distance = endTime - now;
                    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    setTimeLeft(`${days}일 ${hours}시간 ${minutes}분 ${seconds}초 남음`);
                }
            }

            // --- 결제 기한 타이머 로직 ---
            if (product.status === 'AUCTION_ENDED' && product.paymentDueDate) {
                const endTime = new Date(product.paymentDueDate).getTime();
                const now = Date.now();

                if (endTime < now) {
                    // 결제 기한이 지났을 경우
                    setPaymentTimeLeft("결제 기한 만료");
                    // 서버의 스케줄러가 상태를 EXPIRED로 변경할 것이므로, 2초 후 동기화
                    setTimeout(() => fetchProduct(), 2000);
                    clearInterval(timer); // 타이머 정리
                } else {
                    // 결제 기한이 남았을 경우 남은 시간 계산
                    const distance = endTime - now;
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    setPaymentTimeLeft(`${hours}시간 ${minutes}분 ${seconds}초 내에 결제`);
                }
            }
        }, 1000);

        // 컴포넌트가 언마운트되거나 의존성이 변경될 때 타이머를 반드시 정리
        return () => clearInterval(timer);

    }, [product?.status, product?.auctionEndTime, product?.paymentDueDate]); // 의존성 배열은 그대로 유지


    // --- ★★★ 3. 웹소켓 연결 useEffect ★★★ ---
    useEffect(() => {
        if (!isLoggedIn || !productId || (product && product.status !== 'ON_SALE')) {
            return; // ON_SALE 상태일 때만 연결
        }

        const token = localStorage.getItem('accessToken');
        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-stomp`),
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                console.log('STOMP Connected!');
                setIsConnected(true);
                client.subscribe(`/sub/products/${productId}`, (message) => {
                    const bidResponse: BidResponse = JSON.parse(message.body);
                    setProduct(prev => prev ? { ...prev, currentPrice: bidResponse.newPrice, highestBidderName: bidResponse.bidderName } : null);
                });
                client.subscribe('/user/queue/errors', (message) => {
                    showAlert('입찰 실패', message.body);
                });
            },
            onDisconnect: () => setIsConnected(false),
            onStompError: (frame) => console.error('Broker error:', frame.headers['message']),
        });

        client.activate();
        stompClient.current = client;

        return () => {
            if (stompClient.current?.active) {
                stompClient.current.deactivate();
            }
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
                                            {isLoggedIn && !product.seller && (
                                                <button onClick={handleChatClick} className="bg-green-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm">
                                                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                                    <span>채팅하기</span>
                                                </button>
                                            )}

                                            {/* 판매자에게 보이는 더보기 버튼 */}
                                            {isLoggedIn && product.seller && (
                                                <div className="relative" ref={menuRef}>
                                                    <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-2 rounded-full hover:bg-gray-100">
                                                        <EllipsisVerticalIcon className="w-6 h-6 text-gray-600"/>
                                                    </button>
                                                    {isMenuOpen && (
                                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
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
                            <p className="text-gray-500 mb-1">판매자: {product.sellerName}</p>

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
                                            if (product.seller) {
                                                return (
                                                    <div className="text-center p-4 bg-yellow-100 text-yellow-800 rounded-md font-semibold">자신이 등록한 상품입니다.</div>
                                                );
                                            }
                                            return (
                                                <div className="flex space-x-2">
                                                    <input type="number" value={bidAmount} onChange={(e) => setBidAmount(parseInt(e.target.value, 10) || 0)} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" placeholder="현재가보다 높은 금액"/>
                                                    <button onClick={handleBidSubmit} className="w-1/3 bg-blue-600 text-white font-bold p-3 rounded-md disabled:bg-gray-400" disabled={!isConnected}>
                                                        {isConnected ? '입찰' : '연결 중'}
                                                    </button>
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
            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                        <h2 className="text-2xl font-bold mb-4">결제 진행</h2>

                        {/* 결제 위젯이 렌더링될 영역 */}
                        <div id="payment-widget"></div>

                        <div className="flex justify-end space-x-4 mt-8">
                            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="bg-gray-200 px-4 py-2 rounded-md">취소</button>
                            <button type="button" onClick={handleFinalPayment} className="bg-blue-600 text-white px-4 py-2 rounded-md">
                                {product.currentPrice.toLocaleString()}원 결제
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