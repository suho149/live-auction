// src/components/AdminRoute.tsx

import React, {JSX} from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../hooks/useAuthStore';

// UserInfo 타입에 role이 포함되어 있어야 함
// (useAuthStore.ts에서 UserInfo 인터페이스에 role: string; 추가 필요)

const AdminRoute = ({ children }: { children: JSX.Element }) => {
    const { userInfo, isLoggedIn } = useAuthStore();

    // 로딩 중이거나 로그아웃 상태면 접근 불가
    if (!isLoggedIn || !userInfo) {
        // alert("로그인이 필요합니다.");
        return <Navigate to="/" replace />;
    }

    // 사용자의 역할이 'ADMIN'이 아니면 접근 불가
    if (userInfo.role !== 'ADMIN') {
        alert("접근 권한이 없습니다.");
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;