import React, {useCallback, useState} from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

// 백엔드의 Category Enum과 이름 및 순서를 일치시키는 것이 중요합니다.
const categories = ["DIGITAL_DEVICE", "APPLIANCES", "FURNITURE", "HOME_LIFE", "CLOTHING", "BEAUTY", "SPORTS_LEISURE", "BOOKS_TICKETS", "PET_SUPPLIES", "ETC"];
const categoryKoreanNames: { [key: string]: string } = {
    DIGITAL_DEVICE: "디지털 기기", APPLIANCES: "생활가전", FURNITURE: "가구/인테리어", HOME_LIFE: "생활/주방", CLOTHING: "의류", BEAUTY: "뷰티/미용", SPORTS_LEISURE: "스포츠/레저", BOOKS_TICKETS: "도서/티켓/음반", PET_SUPPLIES: "반려동물용품", ETC: "기타 중고물품"
};

const ProductRegistrationPage = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startPrice, setStartPrice] = useState(0);
    const [category, setCategory] = useState(categories[0]);
    const [auctionEndTime, setAuctionEndTime] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [buyNowPrice, setBuyNowPrice] = useState<number | null>(null);

    const addFiles = useCallback((newFiles: File[]) => {
        setImageFiles(prevFiles => {
            const combined = [...prevFiles, ...newFiles];
            // 중복 파일 제거 (파일 이름과 크기가 같은 경우)
            const uniqueFiles = combined.filter(
                (file, index, self) => index === self.findIndex(f => f.name === file.name && f.size === file.size)
            );

            if (uniqueFiles.length > 10) {
                alert('이미지는 최대 10장까지 등록할 수 있습니다.');
                return uniqueFiles.slice(0, 10); // 10개까지만 유지
            }
            return uniqueFiles;
        });
    }, []);

    // 1: handleFileSelect가 addFiles를 호출하도록 변경
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    // 2: handleDrop이 addFiles를 호출하도록 변경
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    }, [addFiles]);

    const removeImage = (indexToRemove: number) => {
        setImageFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    // 폼 제출 시 호출되는 함수
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (imageFiles.length === 0) {
            alert('이미지를 1장 이상 등록해야 합니다.');
            return;
        }

        // 즉시 구매가는 시작가보다 높아야 한다는 유효성 검사
        if (buyNowPrice !== null && startPrice >= buyNowPrice) {
            alert('즉시 구매가는 시작가보다 높아야 합니다.');
            return;
        }

        setIsUploading(true);

        try {
            // 1. 이미지 파일을 FormData에 담아 백엔드로 전송
            const imageFormData = new FormData();
            imageFiles.forEach(file => {
                imageFormData.append('files', file);
            });
            const imageUploadResponse = await axiosInstance.post<string[]>('/api/v1/images/upload', imageFormData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const imageUrls = imageUploadResponse.data; // 백엔드로부터 가짜 URL 목록을 받음

            // 2. 백엔드로 보낼 전체 상품 데이터 구성
            const productData = {
                name,
                description,
                startPrice,
                category,
                auctionEndTime,
                imageUrls,
                // buyNowPrice가 0보다 큰 유효한 숫자인 경우에만 값을 보내고, 아니면 null을 보냄
                buyNowPrice: buyNowPrice && buyNowPrice > 0 ? buyNowPrice : null,
            };
            await axiosInstance.post('/api/v1/products', productData);

            alert('상품이 성공적으로 등록되었습니다.');
            navigate('/');

        } catch (error) {
            console.error('상품 등록 실패:', error);
            alert('상품 등록에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <div className="container mx-auto p-8 max-w-2xl">
                <h1 className="text-3xl font-bold mb-8 text-gray-800">새 경매 상품 등록</h1>
                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">상품 이미지 (1장 이상, 최대 10장)</label>
                        <div
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
                        >
                            <div className="space-y-1 text-center">
                                {/* SVG 아이콘 */}
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                        <span>파일 선택</span>
                                        {/* input의 required 속성 제거 */}
                                        <input id="file-upload" name="files" type="file" multiple accept="image/*" onChange={handleFileSelect} className="sr-only"/>
                                    </label>
                                    <p className="pl-1">또는 파일을 드래그 해주세요</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>
                        {imageFiles.length > 0 && (
                            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {imageFiles.map((file, index) => (
                                    <div key={`${file.name}-${index}`} className="relative group">
                                        <img src={URL.createObjectURL(file)} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-md"/>
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            X
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 나머지 폼 필드들 (변경 없음) */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">카테고리</label>
                        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{categoryKoreanNames[cat]}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">상품명</label>
                        <input type="text" name="name" id="name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">상품 설명</label>
                        <textarea name="description" id="description" rows={4} required value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <label htmlFor="startPrice" className="block text-sm font-medium text-gray-700">시작가 (원)</label>
                        <input type="number" name="startPrice" id="startPrice" min="0" required value={startPrice} onChange={(e) => setStartPrice(parseInt(e.target.value, 10) || 0)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        {/* 즉시 구매가 label 및 input 필드 */}
                        <label htmlFor="buyNowPrice" className="block text-sm font-medium text-gray-700">
                            즉시 구매가 (선택)
                            <span className="text-xs text-gray-500 ml-2">비워두면 즉시 구매 불가</span>
                        </label>
                        <input
                            type="number"
                            name="buyNowPrice"
                            id="buyNowPrice"
                            min="0"
                            value={buyNowPrice === null ? '' : buyNowPrice}
                            onChange={(e) => setBuyNowPrice(e.target.value ? parseInt(e.target.value, 10) : null)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="시작가보다 높은 금액"
                        />
                    </div>
                    <div>
                        <label htmlFor="auctionEndTime" className="block text-sm font-medium text-gray-700">경매 종료 시간</label>
                        <input type="datetime-local" name="auctionEndTime" id="auctionEndTime" required value={auctionEndTime} onChange={(e) => setAuctionEndTime(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <button type="submit" disabled={isUploading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 disabled:bg-gray-400">
                            {isUploading ? '업로드 중...' : '상품 등록하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductRegistrationPage;