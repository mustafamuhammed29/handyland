/**
 * Converts a relative image path from the backend to an absolute URL.
 * Uses VITE_API_BASE_URL in production, falls back to localhost:5000 for dev.
 */
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

export const getImageUrl = (url: string | undefined | null, fallback?: string): string => {
    const defaultFallback = fallback || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80';
    if (!url) return defaultFallback;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};
