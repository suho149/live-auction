import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

interface NotificationState {
    unreadCount: number;
    fetchUnreadCount: () => Promise<void>;
    incrementUnreadCount: () => void;
    decrementUnreadCount: () => void;
    clearUnreadCount: () => void;
}

const useNotificationStore = create<NotificationState>((set) => ({
    unreadCount: 0,

    fetchUnreadCount: async () => {
        try {
            const response = await axiosInstance.get<number>('/api/v1/notifications/count');
            set({ unreadCount: response.data });
        } catch (error) {
            console.error("Failed to fetch unread notification count", error);
        }
    },

    incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),

    decrementUnreadCount: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

    clearUnreadCount: () => set({ unreadCount: 0 }),
}));

export default useNotificationStore;