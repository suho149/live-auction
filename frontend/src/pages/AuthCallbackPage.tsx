import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AuthCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        if (accessToken && refreshToken) {
            // 토큰을 로컬 스토리지에 저장
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            // 토큰 저장 후 홈페이지로 이동
            navigate('/');
        } else {
            // 토큰이 없는 경우 에러 처리 또는 메인 페이지로 이동
            alert('로그인에 실패했습니다.');
            navigate('/');
        }
    }, [searchParams, navigate]);

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h2>로그인 처리 중...</h2>
        </div>
    );
};

export default AuthCallbackPage;