import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Header from '../components/Header';
import useNotificationStore from '../hooks/useNotificationStore';

interface Notification {
    id: number;
    content: string;
    url: string;
    isRead: boolean;
    createdAt: string;
    type: 'BID' | 'CHAT' | 'KEYWORD';
}

const NotificationListPage = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { decrementUnreadCount } = useNotificationStore();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await axiosInstance.get<Notification[]>('/api/v1/notifications');
                setNotifications(response.data);
            } catch (error) {
                console.error("알림 목록을 불러오는 데 실패했습니다.", error);
            }
        };
        fetchNotifications();
    }, []);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            try {
                await axiosInstance.post(`/api/v1/notifications/${notification.id}/read`);
                // UI 즉시 반영
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
                );
                decrementUnreadCount();
            } catch (error) {
                console.error("알림 읽음 처리 실패:", error);
            }
        }
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
                                <Link
                                    to={noti.url}
                                    onClick={() => handleNotificationClick(noti)}
                                    className={`block p-4 transition-colors ${noti.isRead ? 'bg-white' : 'bg-blue-50 hover:bg-blue-100'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <p className="text-gray-800">{noti.content}</p>
                                        {!noti.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {new Date(noti.createdAt).toLocaleString('ko-KR')}
                                    </p>
                                </Link>
                            </li>
                        )) : <p className="p-4 text-center text-gray-500">받은 알림이 없습니다.</p>}
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default NotificationListPage;