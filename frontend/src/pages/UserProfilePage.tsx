import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import StarRating from '../components/StarRating';
import ProductCard from '../components/ProductCard';
import { fetchUserProfile, UserProfile } from '../api/userApi';
import { API_BASE_URL } from '../api/axiosInstance';

const UserProfilePage = () => {
    const { userId } = useParams<{ userId: string }>();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            setLoading(true);
            fetchUserProfile(Number(userId))
                .then(setProfile)
                .catch(error => console.error("프로필 정보 로딩 실패:", error))
                .finally(() => setLoading(false));
        }
    }, [userId]);

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

                {/* 2. 판매 중인 상품 */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4">판매 중인 상품</h2>
                    {profile.sellingProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {profile.sellingProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">현재 판매 중인 상품이 없습니다.</p>
                    )}
                </div>

                {/* 3. 받은 거래 후기 */}
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
                                    <p className="text-gray-700">"{review.comment}"</p>
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