import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import useNotificationStore, { Notification } from '../hooks/useNotificationStore';

const NotificationListPage = () => {
    const { notifications, unreadCount, fetchNotifications, readNotification, readAllNotifications } = useNotificationStore();
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
                {/* 헤더와 '모두 읽음' 버튼 영역 */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">알림 목록</h1>
                    {/* 안 읽은 알림이 있을 때만 버튼을 활성화 */}
                    <button
                        onClick={readAllNotifications}
                        disabled={unreadCount === 0}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        모두 읽음 처리
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-md">
                    <ul className="divide-y divide-gray-200">
                        {notifications.length > 0 ? notifications.map(noti => (
                            <li key={noti.id}>
                                <div
                                    onClick={() => handleNotificationClick(noti)}
                                    // 읽음/안읽음 상태에 따라 배경색과 커서 변경
                                    className={`block p-4 transition-colors ${
                                        noti.isRead
                                            ? 'bg-white text-gray-500'
                                            : 'bg-blue-50 hover:bg-blue-100 cursor-pointer font-medium text-gray-800'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <p>
                                            {noti.type === 'CHAT' && noti.unreadCount > 1
                                                ? `${noti.content} (+${noti.unreadCount - 1})`
                                                : noti.content
                                            }
                                        </p>
                                        {!noti.isRead && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 ml-4"></span>}
                                    </div>
                                    <p className="text-sm mt-1">
                                        {new Date(noti.createdAt).toLocaleString('ko-KR')}
                                    </p>
                                </div>
                            </li>
                        )) : (
                            <li className="p-8 text-center text-gray-500">받은 알림이 없습니다.</li>
                        )}
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default NotificationListPage;