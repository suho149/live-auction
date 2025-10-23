import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance, { API_BASE_URL } from '../api/axiosInstance';
import useAuthStore from '../hooks/useAuthStore';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import {BellIcon} from "@heroicons/react/16/solid";
import useNotificationStore from "../hooks/useNotificationStore";

// 사용자 정보 타입 정의 (변경 없음)
interface UserInfo {
    name: string;
    picture: string;
}

const Header = () => {
    // 스토어에서 상태와 액션을 직접 가져옴
    const { isLoggedIn, userInfo, logout, fetchUserInfo } = useAuthStore();
    const { unreadCount, fetchUnreadCount } = useNotificationStore();
    const googleLoginUrl = `${API_BASE_URL}/oauth2/authorization/google`;

    const handleLoginClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        //  로그 추가
        console.log('[Header.tsx] Login link clicked!');
        console.log('[Header.tsx] Target URL:', event.currentTarget.href);
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

        // event.preventDefault(); // 만약 이 코드가 있다면 주석 처리하거나 삭제해야 합니다.
    };

    // 앱이 로드될 때 (isLoggedIn 상태가 true이면) 사용자 정보를 가져옴
    useEffect(() => {
        if (isLoggedIn && !userInfo) {
            fetchUserInfo();
        }
    }, [isLoggedIn, userInfo, fetchUserInfo]);

    // 프로필 이미지 URL을 처리하는 함수 추가
    const getProfileImageUrl = (url: string) => {
        // URL이 http로 시작하면 외부 URL(구글 프로필 등)로 간주하고 그대로 사용
        if (url.startsWith('http')) {
            return url;
        }
        // 그렇지 않으면 백엔드 서버의 로컬 이미지 경로로 간주
        return `${API_BASE_URL}${url}`;
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchUnreadCount();
        }
    }, [isLoggedIn]);

    return (
        <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
            <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                <span role="img" aria-label="rocket">🚀</span>
                <span>UPBID</span>
            </Link>
            <nav className="flex items-center space-x-6"> {/* space-x-4 -> space-x-6로 간격 조정 */}
                {isLoggedIn && userInfo ? (
                    <>
                        {/* 관리자일 경우 관리자 페이지 링크 표시 */}
                        {userInfo.role === 'ADMIN' && (
                            <Link to="/admin/dashboard" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm font-semibold">
                                👑 관리자 페이지
                            </Link>
                        )}
                        {/* 알림 아이콘 버튼 */}
                        <Link to="/notifications" className="relative text-gray-500 hover:text-blue-600">
                            <BellIcon className="w-7 h-7" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </Link>

                        {/* 채팅 아이콘 버튼 추가 */}
                        <Link to="/chat/rooms" className="text-gray-500 hover:text-blue-600">
                            <ChatBubbleLeftEllipsisIcon className="w-7 h-7" />
                        </Link>
                        <Link to="/products/new" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-semibold">
                            + 상품 등록
                        </Link>

                        <div className="flex items-center space-x-3">
                            <Link to="/my-auctions" className="font-semibold text-gray-700 hover:text-blue-600">나의 경매</Link>
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

                            <button onClick={logout} className="text-gray-500 hover:text-gray-900 text-sm">
                                로그아웃
                            </button>
                        </div>
                    </>
                ) : (
                    <a
                        href={`${API_BASE_URL}/oauth2/authorization/google`}
                        onClick={handleLoginClick} // <--- 여기에 onClick 핸들러 추가
                        className="bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 font-semibold"
                    >
                        로그인 / 회원가입
                    </a>
                )}
            </nav>
        </header>
    );
};

export default Header;