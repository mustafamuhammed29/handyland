import axios from 'axios';


// Force empty baseURL — Vite proxy handles all /api calls in dev;
// In production, the admin panel might be served from a different origin.
const API_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'x-app-type': 'admin'
    },
    timeout: 10000
});

// Request interceptor for CSRF Protection
api.interceptors.request.use(
    async (config) => {
        let csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='))
            ?.split('=')?.[1];

        if (!csrfToken && config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
            try {
                await axios.get('/api/auth/csrf', { baseURL: API_URL, withCredentials: true });
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

// Response Interceptor (Handle 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Prevent infinite loop: do not dispatch auth:unauthorized if the request was to /logout
            if (error.config && error.config.url && error.config.url.includes('/logout')) {
                return Promise.reject(error);
            }

            console.error("Unauthorized! Redirecting to login...");
            localStorage.removeItem('adminUser');
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Dispatch event for AuthContext to handle
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
        return Promise.reject(error);
    }
);

export const fetcher = (url: string) => api.get(url).then(res => res.data);
