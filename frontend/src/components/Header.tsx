import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance, { API_BASE_URL } from '../api/axiosInstance';

// 사용자 정보 타입 정의 (변경 없음)
interface UserInfo {
    name: string;
    picture: string;
}

const Header = () => {
    const navigate = useNavigate();
    const accessToken = localStorage.getItem('accessToken');
    const isLoggedIn = !!accessToken;
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (isLoggedIn) {
                try {
                    const response = await axiosInstance.get('/api/v1/users/me');
                    setUserInfo(response.data);
                } catch (error) {
                    console.error("Failed to fetch user info for header:", error);
                    handleLogout(false);
                }
            }
        };
        fetchUserInfo();
    }, [isLoggedIn]);

    const handleLogout = (showAlert = true) => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (showAlert) {
            alert('로그아웃 되었습니다.');
        }
        window.location.replace('/');
    };

    // ★ 프로필 이미지 URL을 처리하는 함수 추가
    const getProfileImageUrl = (url: string) => {
        // URL이 http로 시작하면 외부 URL(구글 프로필 등)로 간주하고 그대로 사용
        if (url.startsWith('http')) {
            return url;
        }
        // 그렇지 않으면 백엔드 서버의 로컬 이미지 경로로 간주
        return `${API_BASE_URL}${url}`;
    };

    return (
        <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
            <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                <span role="img" aria-label="rocket">🚀</span>
                <span>Real-Time Auction</span>
            </Link>
            <nav className="flex items-center space-x-6"> {/* space-x-4 -> space-x-6로 간격 조정 */}
                {isLoggedIn && userInfo ? (
                    <>
                        <Link to="/products/new" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-semibold">
                            + 상품 등록
                        </Link>

                        {/* ★★★ 레이아웃 순서 및 클래스 수정 ★★★ */}
                        <div className="flex items-center space-x-3">
                            <Link to="/mypage" className="flex items-center space-x-2 group">
                                <img
                                    // ★ getProfileImageUrl 함수 사용
                                    src={userInfo.picture ? getProfileImageUrl(userInfo.picture) : 'https://placehold.co/40x40?text=U'}
                                    alt="profile"
                                    // ★ 이미지 스타일 수정
                                    className="w-9 h-9 rounded-full object-cover border-2 border-transparent group-hover:border-blue-500 transition"
                                />
                                <span className="font-semibold text-gray-700 group-hover:text-blue-600">{userInfo.name}님</span>
                            </Link>

                            <button onClick={() => handleLogout()} className="text-gray-500 hover:text-gray-900 text-sm">
                                로그아웃
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        onClick={() => window.location.href = 'http://localhost:8080/oauth2/authorization/google'}
                        className="bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 font-semibold"
                    >
                        로그인 / 회원가입
                    </button>
                )}
            </nav>
        </header>
    );
};

export default Header;