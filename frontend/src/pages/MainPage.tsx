import React from 'react';

const MainPage = () => {
    const handleGoogleLogin = () => {
        // 백엔드의 구글 로그인 URL로 리다이렉트
        window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h1>실시간 경매 플랫폼</h1>
            <button onClick={handleGoogleLogin} style={{ padding: '10px 20px', fontSize: '16px' }}>
                Google로 로그인하기
            </button>
        </div>
    );
};

export default MainPage;