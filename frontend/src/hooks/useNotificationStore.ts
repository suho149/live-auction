import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

export interface Notification {
    id: number;
    content: string;
    url: string;
    isRead: boolean;
    createdAt: string;
    type: 'BID' | 'CHAT' | 'KEYWORD';
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
    addNotification: (notification: Notification) => void;
    updateNotification: (notification: Notification) => void;
    readNotification: (notificationId: number) => void;
    fetchUnreadCount: () => Promise<void>;
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

    updateNotification: (notification) => {
        set(state => ({
            notifications: state.notifications.map(n =>
                n.id === notification.id ? notification : n
            ),
        }));
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
}));

export default useNotificationStore;