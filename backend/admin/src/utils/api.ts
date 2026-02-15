import axios from 'axios';

// Force empty baseURL to rely on Vite proxy for all API calls
console.log('🔧 Admin API Setup - Using Vite proxy for all API calls');
const API_URL = '';

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000
});

// Request Interceptor (Add Token)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor (Handle 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.error("Unauthorized! Redirecting to login...");
            localStorage.removeItem('adminToken');
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Dispatch event for AuthContext to handle
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
        return Promise.reject(error);
    }
);

export const fetcher = (url: string) => api.get(url).then(res => res.data);
