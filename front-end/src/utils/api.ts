import axios from 'axios';
import { ENV } from '../config/env';

// Force empty baseURL to rely on Vite proxy for all API calls
const API_BASE_URL = '';

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'x-app-type': 'frontend'
    },
    timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
    async (config) => {
        // Frontend relies entirely on HTTP-Only cookies (withCredentials: true)
        // We do not send Authorization headers here to prevent mixing with Admin panel tokens.

        // CSRF: Read the XSRF-TOKEN cookie (set by server on first GET) and forward it as a header
        // for all state-changing requests. Safe methods (GET/HEAD/OPTIONS) are excluded by the server.
        let csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='))
            ?.split('=')?.[1];

        // If making a mutating request and token is missing, fetch it automatically
        if (!csrfToken && config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
            try {
                await axios.get('/api/auth/csrf', { baseURL: API_BASE_URL, withCredentials: true });
                csrfToken = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('XSRF-TOKEN='))
                    ?.split('=')?.[1];
            } catch (err) {
                console.error('Failed to pre-fetch CSRF token', err);
            }
        }

        if (csrfToken) {
            config.headers['X-XSRF-Token'] = csrfToken;
        }

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
            const isPublicPath = publicPaths.includes(currentPath) || currentPath === '/';

            if (!isPublicPath) {
                window.dispatchEvent(new CustomEvent('handyland:navigate', { detail: '/login' }));
            }

            return Promise.reject(error);
        }

        // Handle 401 Unauthorized for other endpoints, but NEVER for login/register/forgot-password/reset-password
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register');
        
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
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
                const isPublicPath = publicPaths.includes(currentPath) || currentPath === '/';

                if (!isPublicPath) {
                    window.dispatchEvent(new CustomEvent('handyland:navigate', { detail: '/login' }));
                }

                return Promise.reject(refreshError);
            }
        }

        // Handle 403 Forbidden (Blocked account or Unverified Email)
        if (error.response?.status === 403) {
            const isAuthError = error.response.data?.accountDeactivated || error.response.data?.emailNotVerified;
            if (isAuthError) {
                localStorage.removeItem('user');
                // Only redirect if NOT on public pages
                const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/'];
                const currentPath = window.location.pathname;
                const isPublicPath = publicPaths.includes(currentPath) || currentPath === '/';

                if (!isPublicPath) {
                    window.dispatchEvent(new CustomEvent('handyland:navigate', { detail: '/login' }));
                }
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
