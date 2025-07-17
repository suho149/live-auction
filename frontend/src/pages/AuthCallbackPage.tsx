import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../hooks/useAuthStore';

const AuthCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    // 스토어에서 setTokens 함수를 선택적으로 가져옴
    const setTokens = useAuthStore((state) => state.setTokens);

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        if (accessToken && refreshToken) {
            // 스토어를 통해 토큰 저장 및 상태 업데이트
            setTokens(accessToken, refreshToken);
            navigate('/'); // 메인 페이지로 이동
        } else {
            // 토큰이 없는 경우 에러 처리 또는 메인 페이지로 이동
            alert('로그인에 실패했습니다.');
            navigate('/');
        }
    }, [searchParams, navigate, setTokens]);

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h2>로그인 처리 중...</h2>
        </div>
    );
};

export default AuthCallbackPage;