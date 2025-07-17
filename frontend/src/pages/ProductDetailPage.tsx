import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance, { API_BASE_URL } from '../api/axiosInstance'; // API_BASE_URL import
import Header from '../components/Header';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import Slider from "react-slick"; // Slider import
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline'; // 찜 아이콘
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import {EllipsisVerticalIcon} from "@heroicons/react/16/solid";

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

const ProductDetailPage = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [bidAmount, setBidAmount] = useState<number>(0);
    const stompClient = useRef<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const isLoggedIn = !!localStorage.getItem('accessToken');
    const [isAuctionEnded, setIsAuctionEnded] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");

    // 드롭다운 메뉴의 열림/닫힘 상태를 관리할 state 추가
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null); // 드롭다운 메뉴 바깥 영역 클릭 감지를 위한 ref


    useEffect(() => {
        // 상품 정보 불러오기
        const fetchProduct = async () => {
            try {
                const response = await axiosInstance.get(`/api/v1/products/${productId}`);
                const productData = response.data;

                console.log("백엔드로부터 받은 상품 데이터:", productData);

                setProduct(productData);
                setBidAmount(productData.currentPrice + 1000);
                const endTime = new Date(productData.auctionEndTime).getTime();
                if (endTime < Date.now()) {
                    setIsAuctionEnded(true);
                }
            } catch (error) {
                console.error("상품 정보를 불러오는 데 실패했습니다.", error);
                alert("존재하지 않는 상품이거나 정보를 불러올 수 없습니다.");
                navigate('/');
            }
        };

        fetchProduct();

        const timer = setInterval(() => {
            if (product) {
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
            }
        }, 1000);

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

        return () => {
            clearInterval(timer);
            if (stompClient.current && stompClient.current.active) {
                stompClient.current.deactivate();
            }
        };
    }, [productId, isLoggedIn, navigate, product?.auctionEndTime]);

    const handleBidSubmit = () => {
        if (!isLoggedIn) {
            alert('로그인이 필요한 기능입니다.');
            return;
        }
        if (isAuctionEnded) {
            alert('이미 종료된 경매입니다.');
            return;
        }
        if (!stompClient.current || !stompClient.current.active) {
            alert('경매 서버에 연결 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        if (!product || bidAmount <= product.currentPrice) {
            alert('현재 가격보다 높은 금액을 입력해야 합니다.');
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
            alert('로그인이 필요한 기능입니다.');
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
                alert("상품 삭제에 실패했습니다.");
            }
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

    // 2. product가 유효한 값이 되면, 이 아래 코드가 실행됨
    const sliderSettings = {
        dots: true,
        infinite: product.imageUrls.length > 1, // 이제 product는 null이 아니므로 안전하게 접근 가능
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-4 sm:p-8">
                <div className="bg-white p-6 rounded-lg shadow-lg grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    <div className="w-full overflow-hidden">
                        <Slider {...sliderSettings}>
                            {product.imageUrls && product.imageUrls.length > 0 ? (
                                product.imageUrls.map((url, index) => (
                                    <div key={index}>
                                        <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                            <img
                                                src={`${API_BASE_URL}${url}`}
                                                alt={`${product.name} ${index + 1}`}
                                                className="w-full h-full object-contain rounded-lg"
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div>
                                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                        <img
                                            src="https://placehold.co/600x400?text=No+Image"
                                            alt="기본 이미지"
                                            className="w-full h-full object-contain rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}
                        </Slider>
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
                                                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">상품 수정</a>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleDeleteClick(); setIsMenuOpen(false); }} className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">상품 삭제</a>
                                                </div>
                                            )}
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
        </div>
    );
};

export default ProductDetailPage;