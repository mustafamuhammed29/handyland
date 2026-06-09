import axios from 'axios';
import { ENV } from '../config/env';

declare module 'axios' {
    export interface AxiosRequestConfig {
        rawResponse?: boolean;
    }
}

// Dynamically set baseURL from environment or fallback to empty for Vite proxy in development
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'x-app-type': 'frontend'
    },
    timeout: 30000,
});

let cachedCsrfToken = '';

// Request interceptor
api.interceptors.request.use(
    async (config) => {
        let csrfTokenCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='))
            ?.split('=')?.[1];
        let csrfToken = csrfTokenCookie ? decodeURIComponent(csrfTokenCookie) : cachedCsrfToken;

        if (!csrfToken && config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
            try {
                const response = await axios.get('/api/auth/csrf', { baseURL: API_BASE_URL, withCredentials: true });
                if (response.data && response.data.token) {
                    cachedCsrfToken = response.data.token;
                    csrfToken = cachedCsrfToken;
                } else {
                    let cookieVal = document.cookie
                        .split('; ')
                        .find(row => row.startsWith('XSRF-TOKEN='))
                        ?.split('=')?.[1];
                    csrfToken = cookieVal ? decodeURIComponent(cookieVal) : undefined;
                }
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
    (response) => {
        if (response.config?.rawResponse) {
            return response;
        }
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.config?.url?.includes('/auth/refresh-token') || error.config?.url?.includes('/auth/refresh')) {
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

        // Handle 401 Unauthorized for other endpoints, but NEVER for login/register/forgot-password/reset-password/refresh-token
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || 
                               originalRequest?.url?.includes('/auth/register') ||
                               originalRequest?.url?.includes('/auth/refresh-token') ||
                               originalRequest?.url?.includes('/auth/refresh');
        
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            try {
                // Try to refresh the access token — backend sets new HttpOnly cookie directly
                await api.post('/api/auth/refresh-token');

                // Retry the original request with the refreshed cookie
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

        // Handle 503 Maintenance Mode
        if (error.response?.status === 503 && error.response?.data?.maintenance) {
            if (window.location.pathname !== '/maintenance') {
                window.location.href = '/maintenance';
            }
            return Promise.reject(error);
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
