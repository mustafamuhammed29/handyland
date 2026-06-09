export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000',
  STRIPE_PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
  GOOGLE_MAPS_KEY: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
} as const;
