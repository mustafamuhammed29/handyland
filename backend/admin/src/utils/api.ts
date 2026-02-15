import axios from 'axios';

// Default to localhost if env var is missing (common in dev)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
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
