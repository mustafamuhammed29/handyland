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
        return config;
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            console.log('🔄 401 Unauthorized (Token missing or expired), attempting refresh...');

            try {
                // Attempt to refresh the token using the HTTP-only refreshToken cookie
                await api.get('/api/auth/refresh');
                console.log('✓ Token refreshed successfully');

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                console.error('❌ Token refresh failed:', refreshError);

                // Only redirect if refresh fails
                localStorage.removeItem('user');
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            console.error('❌ Access Forbidden:', error.response.data.message);
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
