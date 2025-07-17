import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

// 사용자 정보 타입
interface UserInfo {
    id: number;
    name: string;
    email: string;
    picture: string;
}

// 스토어 상태 타입 (actions를 제거하고 함수들을 직접 포함)
interface AuthState {
    isLoggedIn: boolean;
    userInfo: UserInfo | null;
    accessToken: string | null;
    setTokens: (accessToken: string, refreshToken: string) => void;
    logout: () => void;
    fetchUserInfo: () => Promise<void>;
}

const useAuthStore = create<AuthState>()((set, get) => ({
    // --- 상태 (State) ---
    isLoggedIn: !!localStorage.getItem('accessToken'),
    userInfo: null,
    accessToken: localStorage.getItem('accessToken'),

    // --- 액션 (Actions) ---
    setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ isLoggedIn: true, accessToken });
        // 토큰 설정 후 바로 사용자 정보 가져오기
        get().fetchUserInfo();
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ isLoggedIn: false, userInfo: null, accessToken: null });
        window.location.replace('/');
    },

    fetchUserInfo: async () => {
        // 로그인 상태가 아니거나, 이미 유저 정보가 있으면 실행하지 않음
        if (!get().isLoggedIn || get().userInfo) return;

        try {
            const response = await axiosInstance.get<UserInfo>('/api/v1/users/me');
            set({ userInfo: response.data });
        } catch (error) {
            console.error("Failed to fetch user info, logging out.", error);
            // 유효하지 않은 토큰으로 인한 에러일 수 있으므로 로그아웃 처리
            get().logout();
        }
    }
}));

// 스토어 훅 자체를 default로 export 합니다.
export default useAuthStore;