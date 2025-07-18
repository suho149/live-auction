import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../hooks/useAuthStore';
import useNotificationStore, { Notification } from '../hooks/useNotificationStore';
import { API_BASE_URL } from '../api/axiosInstance';
import toast from 'react-hot-toast'; // ★ toast 함수 import

// ★ 커스텀 토스트 UI 컴포넌트
const NotificationToast = ({ notification, t }: { notification: Notification, t: any }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(notification.url); // 클릭 시 해당 URL로 이동
        toast.dismiss(t.id); // 토스트 닫기
    };

    return (
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5">
            <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                        <span className="text-xl">🚀</span>
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">새로운 알림</p>
                        <p className="mt-1 text-sm text-gray-500">{notification.content}</p>
                    </div>
                </div>
            </div>
            <div className="flex border-l border-gray-200">
                <button
                    onClick={handleClick}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    보러가기
                </button>
            </div>
        </div>
    );
};


const GlobalNotificationHandler = () => {
    const { isLoggedIn, accessToken } = useAuthStore();
    const { addNotification, updateNotification, fetchUnreadCount } = useNotificationStore();

    useEffect(() => {
        let eventSource: EventSource | undefined;

        if (isLoggedIn && accessToken) {
            fetchUnreadCount();
            eventSource = new EventSource(`${API_BASE_URL}/api/v1/subscribe?token=${accessToken}`);

            eventSource.onopen = () => console.log("SSE Connection opened.");

            const handleNewNotification = (event: MessageEvent) => {
                try {
                    const newNotification: Notification = JSON.parse(event.data);
                    addNotification(newNotification);
                    // ★★★ react-hot-toast로 팝업 알림 표시 ★★★
                    toast.custom((t) => (
                        <NotificationToast notification={newNotification} t={t} />
                    ), { duration: 5000 }); // 5초간 표시
                } catch (e) {
                    console.error("Error parsing notification data:", e);
                }
            };

            const handleUpdateNotification = (event: MessageEvent) => {
                const updatedNotification: Notification = JSON.parse(event.data);
                updateNotification(updatedNotification);
                toast.custom((t) => (
                    <NotificationToast notification={updatedNotification} t={t} />
                ), { duration: 5000 });
            };

            eventSource.addEventListener('notification', handleNewNotification);
            eventSource.addEventListener('notificationUpdate', handleUpdateNotification);

            eventSource.onerror = (error) => {
                console.error("SSE Error:", error);
                eventSource?.close();
            };
        }

        return () => {
            if (eventSource) eventSource.close();
        };
    }, [isLoggedIn, accessToken, addNotification, updateNotification, fetchUnreadCount]);

    return null;
};

export default GlobalNotificationHandler;