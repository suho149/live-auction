import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8080';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL, // API 요청의 기본 URL
    withCredentials: true,
});

// 요청 인터셉터 추가
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;