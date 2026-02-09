const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export class ApiError extends Error {
    constructor(public status: number, public message: string) {
        super(message);
    }
}

const request = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login'; // Auto-logout
            throw new ApiError(401, 'Session expired. Please login again.');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(response.status, errorData.message || response.statusText);
        }

        return response.json();
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new Error(error instanceof Error ? error.message : 'Network error');
    }
};

export const api = {
    get: <T = any>(endpoint: string) => request(endpoint, { method: 'GET' }) as Promise<T>,
    post: <T = any>(endpoint: string, data: any) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }) as Promise<T>,
    put: <T = any>(endpoint: string, data: any) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }) as Promise<T>,
    delete: <T = any>(endpoint: string) => request(endpoint, { method: 'DELETE' }) as Promise<T>,
};
