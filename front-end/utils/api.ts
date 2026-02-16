import axios from 'axios';
import { ENV } from '../src/config/env';

// Force empty baseURL to rely on Vite proxy for all API calls
console.log('🔧 API Setup - Using Vite proxy for all API calls');
const API_BASE_URL = '';

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors and token refresh
// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
    (response) => response.data, // ✅ Directly return data as per user instructions
    async (error) => {
        const originalRequest = error.config;

        // ✅ CRITICAL: If refresh endpoint itself fails, don't retry
        if (error.config.url?.includes('/auth/refresh')) {
            console.error('❌ [API] Refresh endpoint failed');
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            // Only redirect if NOT already on login/public pages
            const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/'];
            const currentPath = window.location.pathname;
            const isPublicPath = publicPaths.some(path => currentPath.includes(path));

            if (!isPublicPath) {
                window.location.href = '/login';
            }

            return Promise.reject(error);
        }

        // Handle 401 Unauthorized for other endpoints
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            console.log('🔄 [API] 401 Unauthorized, attempting token refresh...');

            try {
                // Try to refresh the access token
                const refreshResponse = await api.get('/auth/refresh');
                const newToken = refreshResponse['token']; // Access token from response

                if (newToken) {
                    localStorage.setItem('accessToken', newToken);
                    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                }

                console.log('✅ [API] Token refreshed successfully');

                // Retry the original request
                return api.request(originalRequest);
            } catch (refreshError) {
                console.error('❌ [API] Token refresh failed:', refreshError);

                // Clear authentication state
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');

                // Only redirect if NOT on public pages
                const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/'];
                const currentPath = window.location.pathname;
                const isPublicPath = publicPaths.some(path => currentPath.includes(path));

                if (!isPublicPath) {
                    console.log('🔄 [API] Redirecting to login...');
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Compatibility exports
export const clearCache = (pattern?: string) => {
    // No-op for now as Axios doesn't have built-in caching like custom fetch wrapper
    // Can be implemented later if needed
};

export class ApiError extends Error {
    constructor(public status: number, public message: string) {
        super(message);
    }
}

export default api;
