import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import Header from '../components/Header';
import { Link } from 'react-router-dom';

// 타입 정의
interface Product {
    id: number;
    name: string;
    currentPrice: number;
    imageUrl: string;
    auctionEndTime: string;
    sellerName: string;
}

const ProductCard = ({ product }: { product: Product }) => (
    <Link to={`/products/${product.id}`} className="block border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <img src={product.imageUrl || "https://via.placeholder.com/400x300"} alt={product.name} className="w-full h-48 object-cover"/>
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


const MainPage = () => {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axiosInstance.get('/api/v1/products');
                setProducts(response.data);
            } catch (error) {
                console.error("상품 목록을 불러오는 데 실패했습니다.", error);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-8">
                {/* 배너 섹션 */}
                <div className="bg-blue-600 text-white p-12 rounded-lg mb-12 text-center">
                    <h1 className="text-5xl font-bold mb-4">세상의 모든 것을 경매하다</h1>
                    <p className="text-xl mb-8">지금 바로 참여하여 특별한 상품을 획득하세요!</p>
                    <div className="max-w-xl mx-auto">
                        <input type="text" placeholder="어떤 상품을 찾고 계신가요?" className="w-full p-4 rounded-full text-gray-900"/>
                    </div>
                </div>

                {/* 상품 목록 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </main>
        </div>
    );
};

export default MainPage;