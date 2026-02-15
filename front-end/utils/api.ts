import axios from 'axios';
import { ENV } from '../src/config/env';

// utils/api.ts expects the BASE URL (e.g. localhost:5000), but ENV.API_URL includes /api
// We strip /api if present to maintain compatibility with existing api.get('/api/...') calls
const API_BASE_URL = ENV.API_URL.endsWith('/api')
    ? ENV.API_URL.slice(0, -4)
    : ENV.API_URL;

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor (Optional for debugging or adding headers dynamically if needed)
api.interceptors.request.use(
    (config) => {
        // You can add logic here if needed, e.g. logging
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check for 401 and if we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Avoid infinite loops if the refresh endpoint itself fails
            if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                // Attempt to refresh the token
                await api.get('/api/auth/refresh');

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, clear session and reject
                // Do NOT redirect here, let the caller (AuthContext) handle the cleanup and redirect
                // to avoid race conditions and infinite loops.
                localStorage.removeItem('user');
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

