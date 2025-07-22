import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { fetchBiddingProducts, fetchSellingProducts } from '../api/mypageApi';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../api/axiosInstance';
import ProductCard, { ProductCardProps } from '../components/ProductCard';

const ProductList = ({ fetchFunction }: { fetchFunction: () => Promise<ProductCardProps[]> }) => {
    const [products, setProducts] = useState<ProductCardProps[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                setProducts(await fetchFunction());
            } catch (error) {
                console.error("상품 목록 로딩 실패", error);
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, [fetchFunction]);

    if (loading) return <p>로딩 중...</p>;
    if (products.length === 0) return <p>해당하는 상품이 없습니다.</p>;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
    );
};

const MyAuctionsPage = () => {
    const [activeTab, setActiveTab] = useState<'bidding' | 'selling'>('bidding');

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-8">
                <h1 className="text-3xl font-bold mb-8">나의 경매</h1>

                {/* 탭 네비게이션 */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('bidding')}
                            className={`${activeTab === 'bidding' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300'} ...`}
                        >
                            입찰 중인 경매
                        </button>
                        <button
                            onClick={() => setActiveTab('selling')}
                            className={`${activeTab === 'selling' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300'} ...`}
                        >
                            판매 중인 경매
                        </button>
                    </nav>
                </div>

                {/* 탭 컨텐츠 */}
                <div>
                    {activeTab === 'bidding' && <ProductList fetchFunction={fetchBiddingProducts} />}
                    {activeTab === 'selling' && <ProductList fetchFunction={fetchSellingProducts} />}
                </div>
            </main>
        </div>
    );
};

export default MyAuctionsPage;