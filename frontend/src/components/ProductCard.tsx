import React from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../api/axiosInstance';

// 컴포넌트가 받을 props의 타입 정의
// MainPage와 MyAuctionsPage에서 사용하는 Product 타입과 일치해야 함
type ProductStatus = 'ON_SALE' | 'AUCTION_ENDED' | 'SOLD_OUT' | 'EXPIRED' | 'FAILED';

export interface ProductCardProps {
    id: number;
    name: string;
    currentPrice: number;
    thumbnailUrl: string | null;
    auctionEndTime: string;
    sellerName: string;
    status: ProductStatus;
}

// 시간 포맷팅을 위한 헬퍼 함수
const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    // '오후 3:05' 와 같은 간단한 시간 표시가 필요하다면 아래 코드를 사용
    // return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    // '2025. 7. 21. 오후 3:05:00' 와 같은 전체 시간 표시
    return date.toLocaleString('ko-KR');
};

const ProductCard: React.FC<{ product: ProductCardProps }> = ({ product }) => {
    const isSoldOut = product.status === 'SOLD_OUT';

    return (
        <Link to={`/products/${product.id}`} className="relative block border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white group">
            <div className="overflow-hidden">
                <img
                    src={product.thumbnailUrl ? `${API_BASE_URL}${product.thumbnailUrl}` : "https://placehold.co/400x300?text=No+Image"}
                    alt={product.name}
                    className={`w-full h-48 object-cover bg-gray-200 transition-transform duration-300 group-hover:scale-105 ${isSoldOut ? 'filter grayscale' : ''}`}
                />
            </div>
            <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 truncate" title={product.name}>{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2">판매자: {product.sellerName}</p>
                <p className={`text-xl font-bold ${isSoldOut ? 'text-gray-500' : 'text-blue-600'}`}>
                    {product.currentPrice.toLocaleString()}원
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    마감: {formatTime(product.auctionEndTime)}
                </p>
            </div>

            {isSoldOut && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-2xl font-bold border-2 border-white px-4 py-2 rounded">판매 완료</span>
                </div>
            )}
        </Link>
    );
};

export default ProductCard;
