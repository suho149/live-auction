import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080', // 백엔드 서버 주소
    withCredentials: true, // 쿠키 전송을 위함 (필요 시)
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