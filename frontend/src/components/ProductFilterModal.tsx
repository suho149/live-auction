// src/components/ProductFilterModal.tsx

import React, {useEffect, useState} from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

// 카테고리 상수 (MainPage와 동일)
const categories = ["ALL", "DIGITAL_DEVICE", "APPLIANCES", "FURNITURE", "HOME_LIFE", "CLOTHING", "BEAUTY", "SPORTS_LEISURE", "BOOKS_TICKETS", "PET_SUPPLIES", "ETC"];
const categoryKoreanNames: { [key: string]: string } = {
    ALL: "전체", DIGITAL_DEVICE: "디지털 기기", APPLIANCES: "생활가전", FURNITURE: "가구/인테리어", HOME_LIFE: "생활/주방", CLOTHING: "의류", BEAUTY: "뷰티/미용", SPORTS_LEISURE: "스포츠/레저", BOOKS_TICKETS: "도서/티켓/음반", PET_SUPPLIES: "반려동물용품", ETC: "기타 중고물품"
};

// 상품 상태 상수 (백엔드 ProductStatus와 동일)
const productStatuses = ["ON_SALE", "AUCTION_ENDED", "SOLD_OUT", "EXPIRED", "FAILED"];
const productStatusKoreanNames: { [key: string]: string } = {
    ON_SALE: "판매 중", AUCTION_ENDED: "경매 종료", SOLD_OUT: "판매 완료", EXPIRED: "기한 만료", FAILED: "유찰"
};

interface ProductFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentFilters: { // 현재 적용된 필터 값들을 받아옴
        category: string;
        minPrice: number | '';
        maxPrice: number | '';
        statuses: string[];
    };
    onApplyFilters: (filters: { // 필터 적용 시 호출될 콜백
        category: string;
        minPrice: number | '';
        maxPrice: number | '';
        statuses: string[];
    }) => void;
}

const ProductFilterModal: React.FC<ProductFilterModalProps> = ({ isOpen, onClose, currentFilters, onApplyFilters }) => {
    const [category, setCategory] = useState(currentFilters.category);
    const [minPrice, setMinPrice] = useState(currentFilters.minPrice);
    const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice);
    const [statuses, setStatuses] = useState<string[]>(currentFilters.statuses);

    // 모달이 열릴 때마다 현재 필터 값으로 초기화
    useEffect(() => {
        setCategory(currentFilters.category);
        setMinPrice(currentFilters.minPrice);
        setMaxPrice(currentFilters.maxPrice);
        setStatuses(currentFilters.statuses);
    }, [isOpen, currentFilters]);

    const handleStatusChange = (status: string) => {
        setStatuses(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const handleApply = () => {
        onApplyFilters({ category, minPrice, maxPrice, statuses });
        onClose();
    };

    const handleReset = () => {
        setCategory("ALL");
        setMinPrice('');
        setMaxPrice('');
        setStatuses([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col">
                {/* 모달 헤더 */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-bold text-gray-800">상세 필터</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* 모달 컨텐츠 */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* 1. 카테고리 필터 */}
                    <div>
                        <h4 className="font-semibold mb-3">카테고리</h4>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                                        category === cat ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {categoryKoreanNames[cat]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. 가격 범위 필터 */}
                    <div>
                        <h4 className="font-semibold mb-3">가격 범위 (현재가)</h4>
                        <div className="flex items-center space-x-2">
                            <input
                                type="number"
                                value={minPrice}
                                onChange={e => setMinPrice(Number(e.target.value) || '')}
                                placeholder="최소 금액"
                                className="w-1/2 p-2 border rounded-md"
                            />
                            <span>~</span>
                            <input
                                type="number"
                                value={maxPrice}
                                onChange={e => setMaxPrice(Number(e.target.value) || '')}
                                placeholder="최대 금액"
                                className="w-1/2 p-2 border rounded-md"
                            />
                        </div>
                    </div>

                    {/* 3. 경매 상태 필터 */}
                    <div>
                        <h4 className="font-semibold mb-3">경매 상태</h4>
                        <div className="flex flex-wrap gap-2">
                            {productStatuses.map(status => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                                        statuses.includes(status) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {productStatusKoreanNames[status]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 모달 푸터 */}
                <div className="flex justify-end p-4 border-t space-x-4">
                    <button onClick={handleReset} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">
                        초기화
                    </button>
                    <button onClick={handleApply} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        필터 적용
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductFilterModal;