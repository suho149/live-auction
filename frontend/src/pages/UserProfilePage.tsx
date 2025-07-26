import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import StarRating from '../components/StarRating';
import ProductCard, {ProductCardProps} from '../components/ProductCard';
import { fetchUserProfile, UserProfile } from '../api/userApi';
import { API_BASE_URL } from '../api/axiosInstance';

const UserProfilePage = () => {
    const { userId } = useParams<{ userId: string }>();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const [sellingProducts, setSellingProducts] = useState<ProductCardProps[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(true);

    useEffect(() => {
        if (userId) {
            setLoading(true);
            // 최초 로딩 시 0페이지(첫 페이지)를 불러옴
            fetchUserProfile(Number(userId), 0)
                .then(data => {
                    setProfile(data);
                    setSellingProducts(data.sellingProductsPage.content);
                    setHasNextPage(!data.sellingProductsPage.last); // 마지막 페이지가 아니면 '더보기' 가능
                })
                .catch(error => console.error("프로필 로딩 실패:", error))
                .finally(() => setLoading(false));
        }
    }, [userId]);

    // ★ '더보기' 버튼 클릭 핸들러
    const handleLoadMore = async () => {
        if (!userId || !hasNextPage) return;

        const nextPage = currentPage + 1;
        try {
            const data = await fetchUserProfile(Number(userId), nextPage);
            // 기존 목록에 새로운 페이지의 상품들을 추가
            setSellingProducts(prev => [...prev, ...data.sellingProductsPage.content]);
            setCurrentPage(data.sellingProductsPage.number);
            setHasNextPage(!data.sellingProductsPage.last);
        } catch (error) {
            console.error("추가 상품 로딩 실패:", error);
        }
    };


    if (loading) {
        return <div>로딩 중...</div>;
    }

    if (!profile) {
        return <div>사용자 정보를 찾을 수 없습니다.</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-8 max-w-4xl space-y-8">
                {/* 1. 프로필 헤더 */}
                <div className="flex items-center space-x-6">
                    <img
                        src={profile.profileImageUrl?.startsWith('http') ? profile.profileImageUrl : `${API_BASE_URL}${profile.profileImageUrl}`}
                        alt={profile.name}
                        className="w-24 h-24 rounded-full shadow-lg"
                    />
                    <div>
                        <h1 className="text-4xl font-bold">{profile.name}</h1>
                        <div className="flex items-center space-x-3 text-gray-600 mt-2">
                            <div className="flex items-center">
                                <StarRating rating={profile.ratingScore} size="sm" />
                                <span className="ml-2">{profile.ratingScore.toFixed(1)} ({profile.reviewCount}개)</span>
                            </div>
                            <span>|</span>
                            <span>판매 {profile.salesCount}회</span>
                        </div>
                    </div>
                </div>

                {/* 판매 중인 상품 */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4">판매 중인 상품</h2>
                    {sellingProducts.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sellingProducts.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                            {/* '더보기' 버튼 */}
                            {hasNextPage && (
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={handleLoadMore}
                                        className="bg-gray-200 px-6 py-2 rounded-md hover:bg-gray-300"
                                    >
                                        더보기
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-gray-500">현재 판매 중인 상품이 없습니다.</p>
                    )}
                </div>

                {/* 받은 거래 후기 (수정) */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4">거래 후기 ({profile.reviewCount}개)</h2>
                    {profile.reviews.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {profile.reviews.map(review => (
                                <li key={review.reviewId} className="py-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-semibold">{review.reviewerName}님의 후기</p>
                                        <StarRating rating={review.rating} size="sm" />
                                    </div>
                                    <p className="text-gray-700 mb-2">"{review.comment}"</p>
                                    {/* 상품명 추가 */}
                                    <p className="text-right text-xs text-gray-400">
                                        - "{review.productName}" 거래
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500">받은 거래 후기가 없습니다.</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default UserProfilePage;