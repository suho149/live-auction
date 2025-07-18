import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import useNotificationStore, { Notification } from '../hooks/useNotificationStore';

const NotificationListPage = () => {
    const { notifications, fetchNotifications, readNotification } = useNotificationStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            readNotification(notification.id);
        }
        navigate(notification.url);
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header />
            <main className="container mx-auto p-8 max-w-3xl">
                <h1 className="text-3xl font-bold mb-8">알림 목록</h1>
                <div className="bg-white rounded-lg shadow-md">
                    <ul className="divide-y divide-gray-200">
                        {notifications.length > 0 ? notifications.map(noti => (
                            <li key={noti.id}>
                                <div
                                    onClick={() => handleNotificationClick(noti)}
                                    className={`block p-4 transition-colors cursor-pointer ${noti.isRead ? 'bg-white' : 'bg-blue-50 hover:bg-blue-100'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        {/* ★★★ 이 부분을 수정합니다 ★★★ */}
                                        <p className="text-gray-800">
                                            {/* 채팅 알림이고, 안 읽은 개수가 1보다 크면 개수를 함께 표시 */}
                                            {noti.type === 'CHAT' && noti.unreadCount > 1
                                                ? `${noti.content} (+${noti.unreadCount - 1})`
                                                : noti.content
                                            }
                                        </p>
                                        {!noti.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-4"></span>}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {new Date(noti.createdAt).toLocaleString('ko-KR')}
                                    </p>
                                </div>
                            </li>
                        )) : (
                            <li className="p-4 text-center text-gray-500">받은 알림이 없습니다.</li>
                        )}
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default NotificationListPage;