// src/api/axiosInstance.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9999';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Tạo instance riêng cho các API có prefix /api
export const axiosInstanceWithApi = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 👉 Thêm interceptor để tự động gắn token nếu có
const addInterceptors = (instance) => {
    instance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) config.headers.Authorization = `Bearer ${token}`;
            return config;
        },
        (error) => Promise.reject(error),
    );

    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                // Token hết hạn => Đăng xuất hoặc refresh token
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    );
};

addInterceptors(axiosInstance);
addInterceptors(axiosInstanceWithApi);

export default axiosInstance;
