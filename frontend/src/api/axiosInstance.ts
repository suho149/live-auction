import axios from 'axios';
import useAuthStore from '../hooks/useAuthStore'; // zustand 스토어 import

export const API_BASE_URL = 'http://localhost:8080';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// 1. 요청 인터셉터: 모든 요청에 Access Token을 담아 보냄
axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = useAuthStore.getState().accessToken; // 스토어에서 직접 토큰 가져오기
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);


// ★★★ 2. 응답 인터셉터: 토큰 만료 시 자동 재발급 로직 ★★★
axiosInstance.interceptors.response.use(
    // 성공적인 응답은 그대로 반환
    (response) => response,

    async (error) => {
        const originalRequest = error.config;
        const { logout, setTokens } = useAuthStore.getState();

        // 401 에러이고, 재시도한 요청이 아닐 경우에만 실행
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // 재시도 플래그 설정

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    // 토큰 재발급 API 호출
                    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/reissue`, {
                        accessToken: useAuthStore.getState().accessToken,
                        refreshToken: refreshToken,
                    });

                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

                    // 새로 받은 토큰을 스토어와 로컬 스토리지에 저장
                    setTokens(newAccessToken, newRefreshToken);

                    // 원래 요청의 헤더에 새로운 토큰을 설정하여 다시 시도
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return axiosInstance(originalRequest);

                } catch (refreshError) {
                    console.error("Token refresh failed, logging out.", refreshError);
                    // Refresh Token도 만료된 경우, 로그아웃 처리
                    logout();
                    return Promise.reject(refreshError);
                }
            } else {
                console.error("No refresh token found, logging out.");
                logout();
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;