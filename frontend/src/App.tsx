import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import MainPage from './pages/MainPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import MyPage from './pages/MyPage';
import ProductRegistrationPage from './pages/ProductRegistrationPage';
import ProductDetailPage from './pages/ProductDetailPage';
import './index.css'; // index.css import
import "react-responsive-carousel/lib/styles/carousel.min.css";
import ChatRoomPage from './pages/ChatRoomPage';
import ChatListPage from './pages/ChatListPage';
import NotificationListPage from "./pages/NotificationListPage";
import GlobalNotificationHandler from "./components/GlobalNotificationHandler";
import {Toaster} from "react-hot-toast";
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailPage from './pages/PaymentFailPage';
import MyAuctionsPage from "./pages/MyAuctionsPage";

function App() {

    return (
        <Router>
            <Toaster position="top-right" reverseOrder={false} />
            {/* ★ SSE 핸들러를 Router 안에 배치하여 항상 활성화되도록 함 */}
            <GlobalNotificationHandler />
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/mypage" element={<MyPage />} />
                {/* 새로운 경로 추가 */}
                <Route path="/products/new" element={<ProductRegistrationPage />} />
                <Route path="/products/:productId" element={<ProductDetailPage />} />
                <Route path="/chat/rooms" element={<ChatListPage />} />
                <Route path="/chat/rooms/:roomId" element={<ChatRoomPage />} />
                <Route path="/notifications" element={<NotificationListPage />} />
                <Route path="/my-auctions" element={<MyAuctionsPage />} />
                {/*  결제 성공/실패 경로 추가 */}
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment/fail" element={<PaymentFailPage />} />
            </Routes>
        </Router>
    );
}

export default App;