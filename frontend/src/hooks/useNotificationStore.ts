import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

export interface Notification {
    id: number;
    content: string;
    url: string;
    isRead: boolean;
    createdAt: string;
    type: 'BID' | 'CHAT' | 'KEYWORD';
    unreadCount: number;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
    addNotification: (notification: Notification) => void;
    updateNotification: (notification: Notification) => void;
    readNotification: (notificationId: number) => void;
    fetchUnreadCount: () => Promise<void>;
    readAllNotifications: () => void;
}

const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,

    fetchNotifications: async () => {
        try {
            const response = await axiosInstance.get<Notification[]>('/api/v1/notifications');
            set({ notifications: response.data });
        } catch (error) {
            console.error("알림 목록 로딩 실패:", error);
        }
    },

    addNotification: (notification) => {
        if (get().notifications.some(n => n.id === notification.id)) return;
        set(state => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        }));
    },

    updateNotification: (updatedNotification: Notification) => {
        set(state => ({
            notifications: state.notifications.map(n =>
                n.id === updatedNotification.id ? updatedNotification : n
            ),
        }));
        // 카운트는 변동 없을 수 있으나, 동기화를 위해 호출
        get().fetchUnreadCount();
    },

    readNotification: (notificationId) => {
        const notification = get().notifications.find(n => n.id === notificationId);
        if (notification && !notification.isRead) {
            set(state => ({
                notifications: state.notifications.map(n =>
                    n.id === notificationId ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
            axiosInstance.post(`/api/v1/notifications/${notificationId}/read`).catch(err => {
                console.error("알림 읽음 처리 API 실패:", err);
            });
        }
    },

    fetchUnreadCount: async () => {
        try {
            const response = await axiosInstance.get<number>('/api/v1/notifications/count');
            set({ unreadCount: response.data });
        } catch (error) {
            console.error("읽지 않은 알림 개수 로딩 실패:", error);
        }
    },

    //'모두 읽음' 액션 구현
    readAllNotifications: async () => {
        try {
            // 1. 먼저 백엔드에 '모두 읽음' API를 호출하고 응답을 기다립니다.
            await axiosInstance.post('/api/v1/notifications/read-all');

            // 2. API 호출이 성공하면, 프론트엔드의 상태를 업데이트합니다.
            set(state => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0,
            }));

        } catch (err) {
            console.error("모두 읽음 처리 API 실패:", err);
            // 에러 발생 시 사용자에게 알려줄 수 있습니다.
            // toast.error("모든 알림을 읽음 처리하는데 실패했습니다.");
        }
    },
}));

export default useNotificationStore;