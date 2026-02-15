export const ENV = {
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    ADMIN_URL: import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174',
    STRIPE_KEY: import.meta.env.VITE_STRIPE_KEY || '',
};

if (!import.meta.env.VITE_API_URL) {
    console.warn('VITE_API_URL not set, using default');
}
