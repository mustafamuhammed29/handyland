import axios from 'axios';
import { ENV } from '../src/config/env';

// Force empty baseURL to rely on Vite proxy for all API calls
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
        // Frontend relies entirely on HTTP-Only cookies (withCredentials: true)
        // We do not send Authorization headers here to prevent mixing with Admin panel tokens.
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
    (response) => response.data, // ✅ Directly return data as per user instructions
    async (error) => {
        const originalRequest = error.config;

        if (error.config?.url?.includes('/auth/refresh')) {
            localStorage.removeItem('user');

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

            try {
                // Try to refresh the access token - use correct /api/auth/refresh endpoint
                const refreshResponse = await api.get('/api/auth/refresh');
                const newToken = (refreshResponse as any)?.token; // Access token from response

                // Backend already set the new HttpOnly cookie — no manual token handling needed.

                // Retry the original request
                return api.request(originalRequest);
            } catch (refreshError) {
                // Clear authentication state
                localStorage.removeItem('user');

                // Only redirect if NOT on public pages
                const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/'];
                const currentPath = window.location.pathname;
                const isPublicPath = publicPaths.some(path => currentPath.includes(path));

                if (!isPublicPath) {
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
