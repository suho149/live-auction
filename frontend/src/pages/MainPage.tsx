import React, {useState, useEffect, useCallback} from 'react';
import axiosInstance, { API_BASE_URL } from '../api/axiosInstance'; // API_BASE_URL import
import Header from '../components/Header';
import {Link, useSearchParams} from 'react-router-dom';
import ProductCard, { ProductCardProps } from '../components/ProductCard';
import ProductFilterModal from '../components/ProductFilterModal';

type ProductStatus = 'ON_SALE' | 'AUCTION_ENDED' | 'SOLD_OUT' | 'EXPIRED' | 'FAILED';

// 타입 정의: imageUrl -> thumbnailUrl로 변경
interface Product {
    id: number;
    name: string;
    currentPrice: number;
    thumbnailUrl: string; // 상품 목록에서는 대표 이미지만 사용
    auctionEndTime: string;
    sellerName: string;
    status: ProductStatus;
}

// 카테고리 상수 (백엔드 Enum과 일치)
const categories = ["ALL", "DIGITAL_DEVICE", "APPLIANCES", "FURNITURE", "HOME_LIFE", "CLOTHING", "BEAUTY", "SPORTS_LEISURE", "BOOKS_TICKETS", "PET_SUPPLIES", "ETC"];
const categoryKoreanNames: { [key: string]: string } = {
    ALL: "전체", DIGITAL_DEVICE: "디지털 기기", APPLIANCES: "생활가전", FURNITURE: "가구/인테리어", HOME_LIFE: "생활/주방", CLOTHING: "의류", BEAUTY: "뷰티/미용", SPORTS_LEISURE: "스포츠/레저", BOOKS_TICKETS: "도서/티켓/음반", PET_SUPPLIES: "반려동물용품", ETC: "기타 중고물품"
};

const MainPage = () => {
    const [products, setProducts] = useState<ProductCardProps[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();

    const getSortAliasFromParams = (sortParam: string | null) => {
        if (sortParam === 'currentPrice,asc') return 'priceAsc';
        if (sortParam === 'currentPrice,desc') return 'priceDesc';
        return 'latest'; // 기본값 또는 'id,desc'
    };

    // --- 필터 상태 관리 (URL 쿼리 파라미터와 동기화) ---
    const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
    const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'ALL');
    const [sortBy, setSortBy] = useState(getSortAliasFromParams(searchParams.get('sort')));
    const [minPrice, setMinPrice] = useState<number | ''>(Number(searchParams.get('minPrice')) || '');
    const [maxPrice, setMaxPrice] = useState<number | ''>(Number(searchParams.get('maxPrice')) || '');
    // statuses는 배열이므로 URL에서 파싱하고 다시 문자열 배열로 변환
    const [statuses, setStatuses] = useState<string[]>(searchParams.getAll('statuses') || []);

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false); // ★ 필터 모달 열림/닫힘 상태

    // API 호출 함수 ( useCallback으로 감싸서 최적화 )
    const fetchProducts = useCallback(async () => {
        try {
            // searchParams 객체를 그대로 API 요청 파라미터로 사용
            const response = await axiosInstance.get(`/api/v1/products?${searchParams.toString()}`);
            setProducts(response.data.content);
        } catch (error) {
            console.error("상품 목록 로딩 실패:", error);
        }
    }, [searchParams]); // searchParams가 변경될 때마다 재호출

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]); // fetchProducts가 변경될 때마다 (실제로는 searchParams 변경 시)


    // 검색 폼 제출 핸들러
    // 검색 폼 제출 핸들러 (변경 없음)
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // 모든 현재 필터 상태를 searchParams에 반영하여 URL 업데이트
        updateSearchParams(keyword, activeCategory, sortBy, minPrice, maxPrice, statuses);
    };

    // 카테고리 변경 핸들러 (변경된 카테고리만 적용)
    const handleCategoryChange = (category: string) => {
        setActiveCategory(category);
        updateSearchParams(keyword, category, sortBy, minPrice, maxPrice, statuses);
    };

    // 정렬 기준 변경 핸들러 (변경된 정렬만 적용)
    const handleSortChange = (sortAlias: string) => {
        setSortBy(sortAlias);
        // 별칭을 백엔드가 이해하는 "{property},{direction}" 형식으로 변환
        const sortValue = {
            'latest': 'id,desc', // 'latest' -> 'id,desc'
            'priceAsc': 'currentPrice,asc',
            'priceDesc': 'currentPrice,desc'
        }[sortAlias];

        // searchParams를 직접 업데이트
        const newSearchParams = new URLSearchParams(searchParams);
        if (sortValue) {
            newSearchParams.set('sort', sortValue);
        } else {
            newSearchParams.delete('sort');
        }
        setSearchParams(newSearchParams);
    };

    // 상세 필터 적용 핸들러
    const handleApplyFilters = (filters: {
        category: string;
        minPrice: number | '';
        maxPrice: number | '';
        statuses: string[];
    }) => {
        setActiveCategory(filters.category);
        setMinPrice(filters.minPrice);
        setMaxPrice(filters.maxPrice);
        setStatuses(filters.statuses);
        updateSearchParams(keyword, filters.category, sortBy, filters.minPrice, filters.maxPrice, filters.statuses);
    };

    // searchParams 업데이트 공통 함수
    const updateSearchParams = (
        keyword: string,
        category: string,
        // 파라미터 이름을 sortAlias로 변경하여 의도를 명확하게 함
        sortAlias: string,
        minPrice: number | '',
        maxPrice: number | '',
        statuses: string[]
    ) => {
        const newSearchParams = new URLSearchParams();

        // 1. 다른 파라미터들은 기존과 동일하게 추가
        if (keyword) newSearchParams.set('keyword', keyword);
        if (category && category !== 'ALL') newSearchParams.set('category', category);
        if (minPrice) newSearchParams.set('minPrice', String(minPrice));
        if (maxPrice) newSearchParams.set('maxPrice', String(maxPrice));
        statuses.forEach(status => newSearchParams.append('statuses', status));

        // sortAlias를 백엔드용 sortValue로 변환하는 로직
        const sortValue = {
            'latest': 'id,desc',        // '최신순' -> 'id' 필드, '내림차순'
            'priceAsc': 'currentPrice,asc', // '낮은 가격순' -> 'currentPrice' 필드, '오름차순'
            'priceDesc': 'currentPrice,desc' // '높은 가격순' -> 'currentPrice' 필드, '내림차순'
        }[sortAlias]; // sortAlias가 'latest'면, sortValue는 'id,desc'가 됨

        // 3. 변환된 sortValue가 존재할 경우에만 URL 파라미터에 추가
        if (sortValue) {
            newSearchParams.set('sort', sortValue);
        }
        // 만약 sortValue가 없다면(예: 기본값이 latest이고, latest일 때 파라미터를 보내고 싶지 않다면),
        // sort 파라미터 자체가 URL에 추가되지 않음.

        // 4. 최종적으로 URL을 업데이트
        setSearchParams(newSearchParams);
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

                {/* ★★★ 카테고리 및 정렬 필터 영역 (수정됨) ★★★ */}
                <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        {/* 카테고리 버튼 그룹 */}
                        <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => handleCategoryChange(cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                    {categoryKoreanNames[cat]}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* 정렬 드롭다운 */}
                            <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)} className="p-2 border border-gray-300 rounded-md">
                                <option value="latest">최신순</option>
                                <option value="priceAsc">낮은 가격순</option>
                                <option value="priceDesc">높은 가격순</option>
                            </select>
                            {/* 상세 필터 버튼 */}
                            <button
                                onClick={() => setIsFilterModalOpen(true)}
                                className="bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 font-semibold"
                            >
                                상세 필터
                            </button>
                        </div>
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

            {/* 상세 필터 모달 렌더링 */}
            <ProductFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                currentFilters={{ category: activeCategory, minPrice, maxPrice, statuses }}
                onApplyFilters={handleApplyFilters}
            />
        </div>
    );
};

export default MainPage;