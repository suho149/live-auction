import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainPage from './pages/MainPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import MyPage from './pages/MyPage';
import ProductRegistrationPage from './pages/ProductRegistrationPage';
import ProductDetailPage from './pages/ProductDetailPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/mypage" element={<MyPage />} />
                {/* 새로운 경로 추가 */}
                <Route path="/products/new" element={<ProductRegistrationPage />} />
                <Route path="/products/:productId" element={<ProductDetailPage />} />
            </Routes>
        </Router>
    );
}

export default App;