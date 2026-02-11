import { ENV } from '../src/config/env';

// utils/api.ts expects the BASE URL (e.g. localhost:5000), but ENV.API_URL includes /api
// We strip /api if present to maintain compatibility with existing api.get('/api/...') calls
const API_URL = ENV.API_URL.endsWith('/api')
    ? ENV.API_URL.slice(0, -4)
    : ENV.API_URL;

export class ApiError extends Error {
    constructor(public status: number, public message: string) {
        super(message);
    }
}

// Simple in-memory cache with TTL (60s default)
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

const getCached = (key: string) => {
    const entry = cache.get(key);
    if (entry && Date.now() < entry.expiry) return entry.data;
    cache.delete(key);
    return null;
};

const setCache = (key: string, data: any) => {
    cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
};

export const clearCache = (pattern?: string) => {
    if (!pattern) { cache.clear(); return; }
    for (const key of cache.keys()) {
        if (key.includes(pattern)) cache.delete(key);
    }
};

const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
};

const request = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const xsrfToken = getCookie('XSRF-TOKEN');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(xsrfToken ? { 'X-XSRF-Token': xsrfToken } : {}),
        ...options.headers,
    };

    const method = options.method || 'GET';

    // Check cache for GET requests
    if (method === 'GET') {
        const cached = getCached(endpoint);
        if (cached) return cached;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include', // Important for cookies
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new ApiError(401, 'Session expired. Please login again.');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(response.status, errorData.message || response.statusText);
        }

        const data = await response.json();

        // Cache successful GET responses
        if (method === 'GET') {
            setCache(endpoint, data);
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new Error(error instanceof Error ? error.message : 'Network error');
    }
};

export const api = {
    get: <T = any>(endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'GET' }) as Promise<T>,
    post: <T = any>(endpoint: string, data: any, options?: RequestInit) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }) as Promise<T>,
    put: <T = any>(endpoint: string, data: any, options?: RequestInit) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }) as Promise<T>,
    delete: <T = any>(endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'DELETE' }) as Promise<T>,
};

