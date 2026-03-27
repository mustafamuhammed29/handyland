import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ToastProvider } from '../context/ToastContext';
import { LanguageProvider } from '../context/LanguageContext';
import { SettingsProvider } from '../context/SettingsContext';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { ThemeProvider } from '../context/ThemeContext';
import { CookieProvider } from '../context/CookieContext';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000,
        },
    },
});

interface AppProvidersProps {
    children: React.ReactNode;
}

/**
 * Compound provider that wraps the entire app.
 * All context providers are co-located here to keep App.tsx clean.
 * Order matters: QueryClientProvider → HelmetProvider → ThemeProvider
 *                → Toast → Language → Settings → Auth → Cart
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <HelmetProvider>
                <ThemeProvider>
                    <CookieProvider>
                        <ToastProvider>
                            <LanguageProvider>
                                <SettingsProvider>
                                    <AuthProvider>
                                        <WishlistProvider>
                                            <CartProvider>
                                                {children}
                                            </CartProvider>
                                        </WishlistProvider>
                                    </AuthProvider>
                                </SettingsProvider>
                            </LanguageProvider>
                        </ToastProvider>
                    </CookieProvider>
                </ThemeProvider>
            </HelmetProvider>
        </QueryClientProvider>
    );
};
