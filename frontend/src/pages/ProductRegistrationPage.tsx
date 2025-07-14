import React, { useState } from 'react';
import Header from '../components/Header';
import { createProduct, ProductCreateRequest } from '../api/productApi';
import { useNavigate } from 'react-router-dom';

const ProductRegistrationPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<ProductCreateRequest>({
        name: '',
        description: '',
        startPrice: 0,
        imageUrl: '',
        auctionEndTime: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, startPrice: parseInt(e.target.value, 10) || 0 });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createProduct(formData);
            alert('상품이 성공적으로 등록되었습니다.');
            navigate('/');
        } catch (error) {
            console.error('상품 등록 실패:', error);
            alert('상품 등록에 실패했습니다.');
        }
    };

    return (
        <div>
            <Header />
            <div className="container mx-auto p-8 max-w-2xl">
                <h1 className="text-3xl font-bold mb-8">상품 등록</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">상품명</label>
                        <input type="text" name="name" id="name" required onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    {/* ... description, startPrice, imageUrl, auctionEndTime 입력 필드 추가 ... */}
                    {/* 예시: 시작가 */}
                    <div>
                        <label htmlFor="startPrice" className="block text-sm font-medium text-gray-700">시작가 (원)</label>
                        <input type="number" name="startPrice" id="startPrice" required onChange={handlePriceChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    {/* 예시: 경매 종료 시간 */}
                    <div>
                        <label htmlFor="auctionEndTime" className="block text-sm font-medium text-gray-700">경매 종료 시간</label>
                        <input type="datetime-local" name="auctionEndTime" id="auctionEndTime" required onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            등록하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductRegistrationPage;