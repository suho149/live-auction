import React, { useState, useEffect } from 'react';
import axiosInstance, { API_BASE_URL } from '../api/axiosInstance'; // API_BASE_URL import
import Header from '../components/Header';
import {Link, useSearchParams} from 'react-router-dom';


// 타입 정의: imageUrl -> thumbnailUrl로 변경
interface Product {
    id: number;
    name: string;
    currentPrice: number;
    thumbnailUrl: string; // 상품 목록에서는 대표 이미지만 사용
    auctionEndTime: string;
    sellerName: string;
}

// 상품 카드 컴포넌트: imageUrl -> thumbnailUrl로 변경
const ProductCard = ({ product }: { product: Product }) => (
    <Link to={`/products/${product.id}`} className="block border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
        <img
            src={product.thumbnailUrl ? `${API_BASE_URL}${product.thumbnailUrl}` : "https://placehold.co/400x300?text=No+Image"}
            alt={product.name}
            className="w-full h-48 object-cover bg-gray-200" // 이미지가 없을 때 배경색 추가
        />
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-2 truncate">{product.name}</h3>
            <p className="text-sm text-gray-600 mb-2">판매자: {product.sellerName}</p>
            <p className="text-xl font-bold text-blue-600">{product.currentPrice.toLocaleString()}원</p>
            <p className="text-xs text-gray-500 mt-2">
                경매 마감: {new Date(product.auctionEndTime).toLocaleString()}
            </p>
        </div>
    </Link>
);

// 카테고리 상수 (백엔드 Enum과 일치)
const categories = ["ALL", "DIGITAL_DEVICE", "APPLIANCES", "FURNITURE", "HOME_LIFE", "CLOTHING", "BEAUTY", "SPORTS_LEISURE", "BOOKS_TICKETS", "PET_SUPPLIES", "ETC"];
const categoryKoreanNames: { [key: string]: string } = {
    ALL: "전체", DIGITAL_DEVICE: "디지털 기기", APPLIANCES: "생활가전", FURNITURE: "가구/인테리어", HOME_LIFE: "생활/주방", CLOTHING: "의류", BEAUTY: "뷰티/미용", SPORTS_LEISURE: "스포츠/레저", BOOKS_TICKETS: "도서/티켓/음반", PET_SUPPLIES: "반려동물용품", ETC: "기타 중고물품"
};

const MainPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchParams, setSearchParams] = useSearchParams(); // ★ URL 쿼리 파라미터 관리 훅

    // URL에서 검색 조건들을 읽어옴
    const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
    const activeCategory = searchParams.get('category') || 'ALL';
    const sortBy = searchParams.get('sort') || 'latest';

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // 현재 URL의 쿼리 파라미터를 그대로 API 요청에 사용
                const response = await axiosInstance.get(`/api/v1/products?${searchParams.toString()}`);
                setProducts(response.data.content);
            } catch (error) {
                console.error("상품 목록을 불러오는 데 실패했습니다.", error);
            }
        };
        fetchProducts();
    }, [searchParams]); // ★ searchParams가 변경될 때마다 상품 목록을 다시 불러옴

    // 검색 폼 제출 핸들러
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // keyword를 포함하여 새로운 쿼리 파라미터로 URL 업데이트
        setSearchParams({ keyword, category: activeCategory, sort: sortBy });
    };

    // 카테고리 변경 핸들러
    const handleCategoryChange = (category: string) => {
        setSearchParams({ keyword, category, sort: sortBy });
    };

    // 정렬 기준 변경 핸들러
    const handleSortChange = (sort: string) => {
        setSearchParams({ keyword, category: activeCategory, sort });
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-4 md:p-8">
                {/* 배너 및 검색창 */}
                <div className="bg-blue-600 text-white p-8 md:p-12 rounded-lg mb-12 text-center shadow-lg">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">세상의 모든 것을 경매하다</h1>
                    <p className="text-lg md:text-xl mb-8">지금 바로 참여하여 특별한 상품을 획득하세요!</p>

                    {/* ★ 검색 폼으로 변경 */}
                    <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="어떤 상품을 찾고 계신가요?"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-full p-4 pl-12 rounded-full text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                    </form>
                </div>

                {/* 카테고리 및 정렬 필터 */}
                <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => handleCategoryChange(cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                    {categoryKoreanNames[cat]}
                                </button>
                            ))}
                        </div>
                        <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)} className="mt-4 md:mt-0 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                            <option value="latest">최신순</option>
                            <option value="priceAsc">낮은 가격순</option>
                            <option value="priceDesc">높은 가격순</option>
                        </select>
                    </div>
                </div>

                {/* 상품 목록 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {products.length > 0 ? (
                        products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500">표시할 상품이 없습니다.</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MainPage;