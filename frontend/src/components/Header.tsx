import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

// 사용자 정보 타입 정의
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
                    // 토큰이 유효하지 않은 경우일 수 있으므로 로그아웃 처리
                    handleLogout(false); // alert 없이 조용히 로그아웃
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
        // 페이지를 새로고침하여 헤더 상태를 확실히 업데이트
        window.location.replace('/');
    };

    return (
        <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
            <Link to="/" className="text-2xl font-bold text-blue-600">
                🚀 Real-Time Auction
            </Link>
            <nav className="flex items-center space-x-4">
                {isLoggedIn && userInfo ? (
                    <>
                        <Link to="/products/new" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
                            + 상품 등록
                        </Link>
                        <button onClick={() => handleLogout()} className="text-gray-600 hover:text-gray-900">
                            로그아웃
                        </button>
                        <Link to="/mypage" className="flex items-center space-x-2">
                            <img
                                src={userInfo.picture ? `http://localhost:8080${userInfo.picture}` : 'https://placehold.co/40x40?text=P'}
                                alt="profile"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <span className="font-semibold">{userInfo.name}님</span>
                        </Link>
                    </>
                ) : (
                    <button
                        onClick={() => window.location.href = 'http://localhost:8080/oauth2/authorization/google'}
                        className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300"
                    >
                        로그인
                    </button>
                )}
            </nav>
        </header>
    );
};

export default Header;