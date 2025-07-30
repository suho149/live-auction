import React, {useEffect} from 'react';
import {BrowserRouter as Router, Navigate, Route, Routes} from 'react-router-dom';
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
import useAuthStore from "./hooks/useAuthStore";
import UserProfilePage from "./pages/UserProfilePage";
import AdminRoute from './components/AdminRoute';
import AdminLayout from './pages/admin/AdminLayout';
import AdminSettlementPage from './pages/admin/AdminSettlementPage';
import AdminUserPage from "./pages/admin/AdminUserPage";
import AdminProductPage from "./pages/admin/AdminProductPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";

function App() {

    // 스토어에서 로그인 상태와 사용자 정보 로딩 함수를 가져옴
    const { isLoggedIn, fetchUserInfo } = useAuthStore();

    // 앱이 처음 로드될 때 로그인 상태를 확인하고 사용자 정보를 가져오는 useEffect 추가
    useEffect(() => {
        // 로그인 상태일 때만 사용자 정보를 가져옴
        if (isLoggedIn) {
            fetchUserInfo();
        }
    }, [isLoggedIn, fetchUserInfo]); // isLoggedIn 상태가 변경될 때마다 실행

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

                <Route path="/users/:userId/profile" element={<UserProfilePage />} />

                {/* --- 관리자 경로 --- */}
                <Route path="/admin" element={
                    <AdminRoute>
                        <AdminLayout />
                    </AdminRoute>
                }>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="settlements" element={<AdminSettlementPage />} />
                    <Route path="users" element={<AdminUserPage />} /> {/* 사용자 관리 경로 추가 */}
                    <Route path="products" element={<AdminProductPage />} /> {/* 상품 관리 경로 추가 */}
                </Route>
            </Routes>
        </Router>
    );
}

export default App;