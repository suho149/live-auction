import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();
    const accessToken = localStorage.getItem('accessToken');
    // 실제로는 토큰에서 사용자 정보를 파싱하거나, /users/me API를 호출해야 함
    // 여기서는 간단하게 토큰 유무로 로그인 상태를 판단
    const isLoggedIn = !!accessToken;

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        alert('로그아웃 되었습니다.');
        navigate('/');
    };

    return (
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">
                Real-Time Auction
            </Link>
            <nav className="flex items-center space-x-4">
                {isLoggedIn ? (
                    <>
                        <Link to="/products/new" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                            + 상품 등록
                        </Link>
                        <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900">
                            로그아웃
                        </button>
                        <Link to="/mypage">
                            <img
                                src={/* 사용자 프로필 이미지 URL */ "https://via.placeholder.com/40"}
                                alt="profile"
                                className="w-10 h-10 rounded-full"
                            />
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