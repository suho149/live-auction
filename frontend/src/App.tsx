import React, {useEffect} from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainPage from './pages/MainPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import MyPage from './pages/MyPage';
import ProductRegistrationPage from './pages/ProductRegistrationPage';
import ProductDetailPage from './pages/ProductDetailPage';
import './index.css'; // index.css import
import "react-responsive-carousel/lib/styles/carousel.min.css";
import ChatRoomPage from './pages/ChatRoomPage';
import ChatListPage from './pages/ChatListPage';
import {API_BASE_URL} from "./api/axiosInstance";
import useAuthStore from "./hooks/useAuthStore";
import NotificationListPage from "./pages/NotificationListPage";

function App() {

    const { isLoggedIn, accessToken } = useAuthStore();

    // ★★★ SSE 알림 수신을 위한 useEffect ★★★
    useEffect(() => {
        let eventSource: EventSource | undefined;

        // 1. 로그인 상태일 때만 SSE 연결 시도
        if (isLoggedIn && accessToken) {

            // 2. 브라우저 알림 권한 요청
            if (Notification.permission !== "granted" && Notification.permission !== "denied") {
                Notification.requestPermission();
            }

            // 3. SSE 연결
            eventSource = new EventSource(`${API_BASE_URL}/api/v1/subscribe?token=${accessToken}`);

            eventSource.onopen = () => {
                console.log("SSE Connection opened.");
            };

            // 4. 'newProduct' 이벤트 수신 리스너
            eventSource.addEventListener('newProduct', (event) => {
                console.log("New product notification:", event.data);

                // 5. 브라우저 알림 표시
                if (Notification.permission === "granted") {
                    new Notification("새 상품 알림! 🚀", {
                        body: event.data,
                    });
                }
            });

            eventSource.onerror = (error) => {
                console.error("SSE Error:", error);
                // 에러 발생 시 연결을 닫아 무한 재연결 방지
                eventSource?.close();
            };
        }

        // 6. 컴포넌트가 언마운트되거나, 로그인 상태가 변경되면 연결 종료
        return () => {
            if (eventSource) {
                eventSource.close();
                console.log("SSE Connection closed.");
            }
        };
    }, [isLoggedIn, accessToken]); // 로그인 상태나 토큰이 변경될 때마다 재연결

    return (
        <Router>
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
            </Routes>
        </Router>
    );
}

export default App;