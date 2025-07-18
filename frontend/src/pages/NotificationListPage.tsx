import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
// ★★★ 스토어와 함께 Notification 타입도 여기서 import 합니다 ★★★
import useNotificationStore, { Notification } from '../hooks/useNotificationStore';

const NotificationListPage = () => {
    // ★★★ useState 대신 스토어에서 직접 상태와 액션을 가져옵니다. ★★★
    const { notifications, fetchNotifications, readNotification } = useNotificationStore();
    const navigate = useNavigate();

    // 컴포넌트가 처음 마운트될 때, 서버로부터 전체 알림 목록을 불러옵니다.
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // ★★★ 알림 항목 클릭 시 실행되는 핸들러 함수 ★★★
    const handleNotificationClick = (notification: Notification) => {
        // 아직 읽지 않은 알림일 경우에만 읽음 처리 액션을 호출합니다.
        if (!notification.isRead) {
            readNotification(notification.id);
        }
        // 알림에 연결된 URL로 페이지를 이동합니다.
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
                                        <p className="text-gray-800">{noti.content}</p>
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