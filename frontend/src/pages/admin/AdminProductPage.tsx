// src/pages/admin/AdminProductPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchAllProducts, forceDeleteProduct } from '../../api/adminApi';
import { Page } from '../../api/userApi';
import { ProductCardProps } from '../../components/ProductCard';

const AdminProductPage = () => {
    const [productsPage, setProductsPage] = useState<Page<ProductCardProps> | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAllProducts(searchParams);
            setProductsPage(data);
        } catch (error) {
            alert("상품 목록 로딩에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, [searchParams]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const handleDelete = async (productId: number) => {
        if (window.confirm(`상품 ID: ${productId}\n정말로 이 상품을 강제 삭제하시겠습니까?`)) {
            try {
                await forceDeleteProduct(productId);
                alert("상품이 삭제되었습니다.");
                loadProducts(); // 목록 새로고침
            } catch (error) {
                alert("상품 삭제에 실패했습니다.");
            }
        }
    };

    const handlePageChange = (page: number) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', String(page));
        setSearchParams(newSearchParams);
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">상품 관리</h2>
            {/* TODO: 관리자용 검색/필터 UI 추가 */}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th>ID</th><th>상품명</th><th>판매자</th><th>현재가</th><th>상태</th><th className="text-right">작업</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-4">로딩 중...</td></tr>
                    ) : productsPage?.content.map(product => (
                        <tr key={product.id}>
                            <td className="px-6 py-4">{product.id}</td>
                            <td className="px-6 py-4 font-medium">{product.name}</td>
                            <td className="px-6 py-4">{product.sellerName}</td>
                            <td className="px-6 py-4">{product.currentPrice.toLocaleString()}원</td>
                            <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">
                                        {product.status}
                                    </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                                <Link to={`/products/${product.id}`} target="_blank" className="text-blue-600 hover:underline text-sm">상세보기</Link>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="text-red-600 hover:underline text-sm font-semibold"
                                >
                                    강제 삭제
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* 페이징 UI */}
            {productsPage && (
                <div className="flex justify-center items-center mt-6 space-x-2">
                    <button onClick={() => handlePageChange(productsPage.number - 1)} disabled={productsPage.first}>이전</button>
                    <span>{productsPage.number + 1} / {productsPage.totalPages}</span>
                    <button onClick={() => handlePageChange(productsPage.number + 1)} disabled={productsPage.last}>다음</button>
                </div>
            )}
        </div>
    );
};

export default AdminProductPage;