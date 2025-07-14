import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

interface UserInfo {
    id: number;
    name: string;
    email: string;
    picture: string;
}

const MyPage = () => {
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                // 백엔드의 테스트 API 호출
                const response = await axiosInstance.get<UserInfo>('/api/v1/users/me');
                setUserInfo(response.data);
            } catch (err) {
                console.error("Failed to fetch user info:", err);
                setError('사용자 정보를 불러오는 데 실패했습니다. 다시 로그인해주세요.');
                // 에러 발생 시 로컬 스토리지 클리어 및 메인으로 이동
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                navigate('/');
            }
        };

        fetchUserInfo();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        alert('로그아웃 되었습니다.');
        navigate('/');
    };

    if (error) {
        return <div style={{ textAlign: 'center', marginTop: '100px', color: 'red' }}>{error}</div>;
    }

    if (!userInfo) {
        return <div style={{ textAlign: 'center', marginTop: '100px' }}>로딩 중...</div>;
    }

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>마이페이지</h1>
            <img src={userInfo.picture} alt="프로필 사진" style={{ borderRadius: '50%', width: '100px', height: '100px' }} />
            <h2>{userInfo.name}님, 환영합니다!</h2>
            <p>이메일: {userInfo.email}</p>
            <button onClick={handleLogout} style={{ marginTop: '20px' }}>로그아웃</button>
        </div>
    );
};

export default MyPage;