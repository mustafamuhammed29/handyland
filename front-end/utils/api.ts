import axios from 'axios';
import { ENV } from '../src/config/env';

// utils/api.ts expects the BASE URL (e.g. localhost:5000), but ENV.API_URL includes /api
// We strip /api if present to maintain compatibility with existing api.get('/api/...') calls
// Force empty baseURL to rely on Vite proxy
console.log('🔧 API Setup - Forcing BASE_URL to empty string for proxy usage');
const API_BASE_URL = '';

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});
withCredentials: true,
    headers: {
    'Content-Type': 'application/json',
    },
timeout: 10000,
});

// Request interceptor - Add token to headers
api.interceptors.request.use(
    (config) => {
        // const token = localStorage.getItem('token'); // Use cookie
        // if (token) {
        //     config.headers.Authorization = `Bearer ${token}`;
        // }
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
            const errorData = error.response.data;

            // Check specific flags from backend or just general 401
            if ((errorData?.tokenExpired || errorData?.message === 'Token has expired') && !originalRequest._retry) {
                originalRequest._retry = true;
                console.log('🔄 Token expired, attempting refresh...');

                try {
                    await api.get('/api/auth/refresh');
                    console.log('✓ Token refreshed successfully');
                    return api(originalRequest);
                } catch (refreshError) {
                    console.error('❌ Token refresh failed:', refreshError);
                    // Clear auth data and redirect to login
                    localStorage.removeItem('user');
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                    return Promise.reject(refreshError);
                }
            }

            // Not authorized or token invalid (and not expired/refreshable)
            console.log('❌ Authentication required - redirecting to login');
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
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

