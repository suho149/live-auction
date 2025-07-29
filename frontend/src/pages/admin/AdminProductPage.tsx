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

    // 1. 관리자용 검색어 상태 관리 (AdminUserPage와 동일)
    const [searchTerm, setSearchTerm] = useState({
        productName: searchParams.get('productName') || '',
        sellerName: searchParams.get('sellerName') || ''
    });

    // 2. API 호출 함수 수정 (AdminUserPage와 동일)
    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            // searchParams를 fetchAllProducts에 그대로 전달합니다.
            // searchParams 자체가 URLSearchParams 타입이므로, 타입이 일치합니다.
            const data = await fetchAllProducts(searchParams);
            setProductsPage(data);
        } catch (error) {
            alert("상품 목록 로딩에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, [searchParams]); // ★ 의존성에 searchParams를 추가합니다.

    // useEffect는 이제 loadProducts만 의존
    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // 4. 핸들러 함수들 추가 (AdminUserPage와 동일)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm({ ...searchTerm, [e.target.name]: e.target.value });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // 검색 시 productName과 sellerName이 빈 문자열일 경우 URL에서 제외
        const params: { [key: string]: string } = { page: '0' };
        if (searchTerm.productName) params.productName = searchTerm.productName;
        if (searchTerm.sellerName) params.sellerName = searchTerm.sellerName;
        setSearchParams(params);
    };

    const handlePageChange = (page: number) => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('page', String(page));
        setSearchParams(newSearchParams);
    };

    const handleDelete = async (productId: number) => {
        if (window.confirm(`상품 ID: ${productId}\n정말로 이 상품을 강제 삭제하시겠습니까?`)) {
            try {
                await forceDeleteProduct(productId);
                alert("상품이 삭제되었습니다.");

                // ★★★ 이 부분을 수정합니다 ★★★
                // loadProducts는 이제 인자 없이 호출합니다.
                // searchParams가 이미 최신 상태이므로, loadProducts는 그 값을 사용하여 API를 호출합니다.
                loadProducts();
            } catch (error) {
                alert("상품 삭제에 실패했습니다.");
            }
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">상품 관리</h2>
            {/* TODO: 관리자용 검색/필터 UI 추가 */}
            {/* 검색 폼 UI 추가 */}
            <form onSubmit={handleSearch} className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center space-x-4">
                <input
                    type="text"
                    name="productName"
                    value={searchTerm.productName}
                    onChange={handleInputChange}
                    placeholder="상품명으로 검색"
                    className="border px-3 py-2 rounded-md flex-1"
                />
                <input
                    type="text"
                    name="sellerName"
                    value={searchTerm.sellerName}
                    onChange={handleInputChange}
                    placeholder="판매자명으로 검색"
                    className="border px-3 py-2 rounded-md flex-1"
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">검색</button>
            </form>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto"> {/* 모바일 화면을 위해 overflow-x-auto 추가 */}
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-2/5">상품명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">판매자</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">현재가</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-4">로딩 중...</td></tr>
                    ) : productsPage?.content.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-xs" title={product.name}>{product.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sellerName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.currentPrice.toLocaleString()}원</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                        {product.status}
                                    </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                <Link to={`/products/${product.id}`} target="_blank" className="text-indigo-600 hover:text-indigo-900">상세보기</Link>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="text-red-600 hover:text-red-900"
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