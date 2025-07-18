import { useEffect } from 'react';
import useAuthStore from '../hooks/useAuthStore';
import useNotificationStore from '../hooks/useNotificationStore';
import { API_BASE_URL } from '../api/axiosInstance';

// 이 컴포넌트는 UI를 렌더링하지 않고, 백그라운드에서 SSE 연결만 관리합니다.
const GlobalNotificationHandler = () => {
    const { isLoggedIn, accessToken } = useAuthStore();
    const { incrementUnreadCount } = useNotificationStore();

    useEffect(() => {
        let eventSource: EventSource | undefined;

        if (isLoggedIn && accessToken) {
            // 브라우저 알림 권한 요청
            if (Notification.permission !== "granted" && Notification.permission !== "denied") {
                Notification.requestPermission();
            }

            eventSource = new EventSource(`${API_BASE_URL}/api/v1/subscribe?token=${accessToken}`);

            eventSource.onopen = () => {
                console.log("SSE Connection opened.");
            };

            // 백엔드에서 보낸 'notification' 이벤트를 수신
            eventSource.addEventListener('notification', (event) => {
                try {
                    const notificationData = JSON.parse(event.data);
                    console.log("New notification received:", notificationData);

                    // Zustand 스토어의 알림 개수 증가
                    incrementUnreadCount();

                    // 브라우저 알림 표시
                    if (Notification.permission === "granted") {
                        new Notification("새로운 알림 🚀", {
                            body: notificationData.content, // DTO의 content 필드 사용
                        });
                    }
                } catch (e) {
                    console.error("Error parsing notification data:", e);
                }
            });

            eventSource.onerror = (error) => {
                console.error("SSE Error:", error);
                eventSource?.close();
            };
        }

        return () => {
            if (eventSource) {
                eventSource.close();
                console.log("SSE Connection closed.");
            }
        };
    }, [isLoggedIn, accessToken, incrementUnreadCount]);

    // 이 컴포넌트는 UI를 렌더링하지 않으므로 null을 반환합니다.
    return null;
};

export default GlobalNotificationHandler;