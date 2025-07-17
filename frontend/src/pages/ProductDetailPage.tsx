import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance, { API_BASE_URL } from '../api/axiosInstance'; // API_BASE_URL import
import Header from '../components/Header';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Carousel } from 'react-responsive-carousel';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline'; // 찜 아이콘
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import {EllipsisVerticalIcon} from "@heroicons/react/16/solid";
import AlertModal from "../components/AlertModal";
import useAuthStore from '../hooks/useAuthStore';

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
}

interface BidResponse {
    productId: number;
    newPrice: number;
    bidderName: string;
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

const ProductDetailPage = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [bidAmount, setBidAmount] = useState<number>(0);
    const stompClient = useRef<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const [isAuctionEnded, setIsAuctionEnded] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");

    // 드롭다운 메뉴의 열림/닫힘 상태를 관리할 state 추가
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null); // 드롭다운 메뉴 바깥 영역 클릭 감지를 위한 ref

    // 수정 모달을 위한 state 추가
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<ProductUpdateRequest>({
        name: '',
        description: '',
        category: 'ETC',
    });

    // 알림 모달을 위한 state 추가
    const [alertInfo, setAlertInfo] = useState<{ isOpen: boolean; title: string; message: string }>({
        isOpen: false,
        title: '',
        message: '',
    });

    // alert()를 대체할 공통 함수
    const showAlert = (title: string, message: string) => {
        setAlertInfo({ isOpen: true, title, message });
    };

    // 상품 데이터를 불러오는 useEffect
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axiosInstance.get(`/api/v1/products/${productId}`);
                const productData = response.data;
                setProduct(productData);
                setBidAmount(productData.currentPrice + 1000);
                setEditFormData({
                    name: productData.name,
                    description: productData.description,
                    category: productData.category,
                });
            } catch (error) {
                console.error("상품 정보를 불러오는 데 실패했습니다.", error);
                alert("존재하지 않는 상품이거나 정보를 불러올 수 없습니다.");
                navigate('/');
            }
        };

        fetchProduct();
    }, [productId, navigate]);

    // 타이머와 웹소켓 연결을 관리하는 useEffect
    // 이 useEffect는 product 데이터가 로드된 후에 실행됩니다.
    useEffect(() => {
        // product가 아직 로드되지 않았으면 아무것도 하지 않음
        if (!product) return;

        // 타이머 설정
        const timer = setInterval(() => {
            const endTime = new Date(product.auctionEndTime).getTime();
            const now = Date.now();
            const distance = endTime - now;
            if (distance < 0) {
                setTimeLeft("경매 종료");
                setIsAuctionEnded(true);
                clearInterval(timer);
            } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${days}일 ${hours}시간 ${minutes}분 ${seconds}초 남음`);
            }
        }, 1000);

        // 웹소켓 연결 (로그인 상태일 때)
        if (isLoggedIn) {
            const token = localStorage.getItem('accessToken');
            const client = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8080/ws-stomp'),
                connectHeaders: { Authorization: `Bearer ${token}` },
                onConnect: () => {
                    console.log('STOMP Connected!');
                    setIsConnected(true);
                    client.subscribe(`/sub/products/${productId}`, (message) => {
                        const bidResponse: BidResponse = JSON.parse(message.body);
                        setProduct(prev => prev ? { ...prev, currentPrice: bidResponse.newPrice, highestBidderName: bidResponse.bidderName } : null);
                    });
                    client.subscribe('/user/queue/errors', (message) => {
                        alert(`입찰 실패: ${message.body}`);
                    });
                },
                onDisconnect: () => {
                    console.log('STOMP Disconnected!');
                    setIsConnected(false);
                },
                onStompError: (frame) => {
                    console.error('Broker reported error: ' + frame.headers['message']);
                    console.error('Additional details: ' + frame.body);
                },
            });
            client.activate();
            stompClient.current = client;
        }

        // 클린업 함수: 컴포넌트가 사라지거나, 의존성이 변경되어 재실행될 때 호출됨
        return () => {
            clearInterval(timer);
            if (stompClient.current && stompClient.current.active) {
                stompClient.current.deactivate();
            }
        };
    }, [product, isLoggedIn, productId]); // product, isLoggedIn, productId에 의존

    const handleBidSubmit = () => {
        if (!isLoggedIn) {
            showAlert('로그인 필요', '입찰에 참여하려면 로그인이 필요합니다.');
            return;
        }
        if (isAuctionEnded) {
            showAlert('경매 종료', '이미 종료된 경매입니다.');
            return;
        }
        if (!stompClient.current || !stompClient.current.active) {
            showAlert('경매 서버에 연결', '경매 서버에 연결 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        if (!product || bidAmount <= product.currentPrice) {
            showAlert('입찰 오류', '현재 가격보다 높은 금액을 입력해야 합니다.');
            return;
        }
        stompClient.current.publish({
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
                        <div>
                            <span className="text-sm font-semibold text-blue-600">{product.category}</span>
                            <div className="flex justify-between items-start my-3">
                                <h1 className="text-3xl lg:text-4xl font-bold mr-4">{product.name}</h1>
                                {/* 찜 버튼과 더보기 메뉴를 그룹으로 묶음 */}
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <button onClick={handleLikeClick} className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                                        {product.likedByCurrentUser ? (
                                            <HeartIconSolid className="w-7 h-7 text-red-500"/>
                                        ) : (
                                            <HeartIconOutline className="w-7 h-7"/>
                                        )}
                                        <span className="font-semibold text-lg">{product.likeCount}</span>
                                    </button>

                                    {/* 판매자에게만 보이는 더보기 버튼 */}
                                    {isLoggedIn && product.seller && (
                                        <div className="relative" ref={menuRef}>
                                            <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-2 rounded-full hover:bg-gray-100">
                                                <EllipsisVerticalIcon className="w-6 h-6 text-gray-600"/>
                                            </button>

                                            {/* 드롭다운 메뉴 (isMenuOpen이 true일 때만 보임) */}
                                            {isMenuOpen && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                                                    <button onClick={() => { setIsEditModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">상품 수정</button>
                                                    <button onClick={() => { handleDeleteClick(); setIsMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">상품 삭제</button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 2. 구매 희망자에게만 보이는 채팅하기 버튼 */}
                                    {isLoggedIn && !product.seller && (
                                        <div className="my-4">
                                            <button onClick={handleChatClick} className="w-full bg-green-500 text-white font-bold py-3 rounded-md hover:bg-green-600 transition-colors">
                                                판매자와 채팅하기
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-gray-500 mb-1">판매자: {product.sellerName}</p>
                            <p className={`text-lg font-bold mb-4 ${isAuctionEnded ? 'text-red-500' : 'text-green-600'}`}>{timeLeft}</p>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                        </div>

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
                                {isAuctionEnded ? (
                                    <div className="text-center p-4 bg-red-100 text-red-700 rounded-md font-bold">종료된 경매입니다.</div>
                                ) : isLoggedIn ? (
                                    <div className="flex space-x-2">
                                        <input type="number" value={bidAmount} onChange={(e) => setBidAmount(parseInt(e.target.value, 10) || 0)} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="현재가보다 높은 금액"/>
                                        <button onClick={handleBidSubmit} className="w-1/3 bg-blue-600 text-white font-bold p-3 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400" disabled={!isConnected}>
                                            {isConnected ? '입찰' : '연결 중'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center p-3 bg-gray-200 rounded-md">
                                        <p>입찰에 참여하려면 <a href={'http://localhost:8080/oauth2/authorization/google'} className="text-blue-600 font-bold hover:underline">로그인</a>이 필요합니다.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {/* ★★★ 상품 수정 모달 UI 추가 ★★★ */}
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