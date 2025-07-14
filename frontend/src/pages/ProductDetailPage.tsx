import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Header from '../components/Header';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// 타입 정의
interface ProductDetail {
    id: number;
    name: string;
    description: string;
    currentPrice: number;
    imageUrl: string;
    auctionEndTime: string;
    sellerName: string;
    highestBidderName: string;
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

    // 경매 상태를 관리할 새로운 상태 추가
    const [isAuctionEnded, setIsAuctionEnded] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        // 상품 정보 불러오기
        const fetchProduct = async () => {
            try {
                const response = await axiosInstance.get(`/api/v1/products/${productId}`);
                const productData = response.data;
                setProduct(productData);
                setBidAmount(productData.currentPrice + 1000);

                // ★ 경매 종료 시간 체크
                const endTime = new Date(productData.auctionEndTime).getTime();
                if (endTime < Date.now()) {
                    setIsAuctionEnded(true);
                }

            } catch (error) {
                console.error("상품 정보를 불러오는 데 실패했습니다.", error);
                alert("존재하지 않는 상품이거나 정보를 불러올 수 없습니다.");
                navigate('/'); // 에러 발생 시 메인 페이지로 이동
            }
        };

        fetchProduct();

        // 남은 시간 계산을 위한 타이머 설정
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

        // 2. 로그인 상태일 때만 웹소켓을 연결
        if (isLoggedIn) {
            const token = localStorage.getItem('accessToken');

            // stompClient 인스턴스 생성
            const client = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8080/ws-stomp'),
                connectHeaders: {
                    Authorization: `Bearer ${token}`, // 연결 시 JWT 토큰을 헤더에 담아 전송
                },
                onConnect: () => {
                    console.log('STOMP Connected!');
                    setIsConnected(true); // 연결 성공 상태 업데이트

                    // 해당 상품의 경매 정보를 구독
                    client.subscribe(`/sub/products/${productId}`, (message) => {
                        const bidResponse: BidResponse = JSON.parse(message.body);

                        // 실시간으로 새로운 입찰 정보를 받아 화면 업데이트
                        setProduct(prevProduct =>
                            prevProduct
                                ? { ...prevProduct, currentPrice: bidResponse.newPrice, highestBidderName: bidResponse.bidderName }
                                : null
                        );
                    });
                    // 입찰 실패 에러 메시지 구독
                    client.subscribe('/user/queue/errors', (message) => {
                        alert(`입찰 실패: ${message.body}`);
                    });
                },
                onDisconnect: () => {
                    console.log('STOMP Disconnected!');
                    setIsConnected(false); // 연결 종료 상태 업데이트
                },
                onStompError: (frame) => {
                    console.error('Broker reported error: ' + frame.headers['message']);
                    console.error('Additional details: ' + frame.body);
                },
            });

            // STOMP 클라이언트 활성화
            client.activate();
            stompClient.current = client;
        }

        // 3. 컴포넌트가 언마운트될 때 (페이지를 벗어날 때) 웹소켓 연결을 정리
        return () => {
            if (stompClient.current && stompClient.current.active) {
                stompClient.current.deactivate();
                console.log('STOMP Deactivated.');
            }
        };
    }, [productId, isLoggedIn, navigate, product?.auctionEndTime]); // 의존성 배열에 product.auctionEndTime

    // 입찰 버튼 클릭 시 실행되는 함수
    const handleBidSubmit = () => {
        // 1. 로그인 여부 확인
        if (!isLoggedIn) {
            alert('로그인이 필요한 기능입니다.');
            // 필요하다면 로그인 페이지로 이동시킬 수도 있습니다.
            // window.location.href = 'http://localhost:8080/oauth2/authorization/google';
            return;
        }

        if(isAuctionEnded) {
            alert('이미 종료된 경매입니다.');
            return;
        }

        // 2. 웹소켓 연결 상태 확인
        if (!stompClient.current || !stompClient.current.active) {
            alert('경매 서버에 연결 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        // 3. 입찰 금액 유효성 검사
        if (!product || bidAmount <= product.currentPrice) {
            alert('현재 가격보다 높은 금액을 입력해야 합니다.');
            return;
        }

        // 4. 모든 조건 통과 시 입찰 메시지 발행 (서버로 전송)
        stompClient.current.publish({
            destination: `/pub/products/${productId}/bids`,
            body: JSON.stringify({ bidAmount: bidAmount }),
        });
    };

    // 상품 정보를 불러오는 동안 로딩 화면 표시
    if (!product) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>상품 정보를 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-4 sm:p-8">
                <div className="bg-white p-6 rounded-lg shadow-lg grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

                    {/* 1. 상품 이미지 영역 */}
                    <div>
                        <img
                            src={product.imageUrl || "https://via.placeholder.com/600x400"}
                            alt={product.name}
                            className="w-full h-auto aspect-square object-cover rounded-lg"
                        />
                    </div>

                    {/* 2. 상품 정보 및 경매 영역 */}
                    <div className="flex flex-col justify-between">
                        <div>
                            <span className="text-sm font-semibold text-blue-600">SELLING</span>
                            <h1 className="text-3xl lg:text-4xl font-bold my-3">{product.name}</h1>
                            <p className="text-gray-500 mb-1">판매자: {product.sellerName}</p>

                            {/* 남은 시간 표시 (isAuctionEnded 상태에 따라 색상 변경) */}
                            <p className={`text-lg font-bold mb-4 ${isAuctionEnded ? 'text-red-500' : 'text-green-600'}`}>
                                {timeLeft}
                            </p>

                            <p className="text-gray-700 leading-relaxed">{product.description}</p>
                        </div>

                        <div className="mt-6">
                            {/* 현재 최고가 표시 영역 */}
                            <div className="bg-gray-100 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-lg">현재 최고가</span>
                                    <span className="text-3xl font-bold text-red-500">{product.currentPrice.toLocaleString()}원</span>
                                </div>
                                <div className="text-right mt-1 text-sm text-gray-600">
                                    <span>입찰자: {product.highestBidderName}</span>
                                </div>
                            </div>

                            {/* 입찰 UI 동적 렌더링 영역 */}
                            <div className="mt-4">
                                {
                                    // 1. 경매가 종료되었는지 먼저 확인
                                    isAuctionEnded ? (
                                            <div className="text-center p-4 bg-red-100 text-red-700 rounded-md font-bold">
                                                종료된 경매입니다.
                                            </div>
                                        )
                                        // 2. 경매가 진행 중일 때, 로그인 상태 확인
                                        : isLoggedIn ? (
                                                <div className="flex space-x-2">
                                                    <input
                                                        type="number"
                                                        value={bidAmount}
                                                        onChange={(e) => setBidAmount(parseInt(e.target.value, 10) || 0)}
                                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="현재가보다 높은 금액"
                                                    />
                                                    <button
                                                        onClick={handleBidSubmit}
                                                        className="w-1/3 bg-blue-600 text-white font-bold p-3 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                                                        disabled={!isConnected} // 웹소켓 연결 전에는 버튼 비활성화
                                                    >
                                                        {isConnected ? '입찰' : '연결 중'}
                                                    </button>
                                                </div>
                                            )
                                            // 3. 경매 진행 중이지만, 비로그인 상태일 때
                                            : (
                                                <div className="text-center p-3 bg-gray-200 rounded-md">
                                                    <p>입찰에 참여하려면 <a href={'http://localhost:8080/oauth2/authorization/google'} className="text-blue-600 font-bold hover:underline">로그인</a>이 필요합니다.</p>
                                                </div>
                                            )
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProductDetailPage;