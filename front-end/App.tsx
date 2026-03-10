import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AppRouter } from './router/AppRouter';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000,
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <HelmetProvider>
                <ToastProvider>
                    <LanguageProvider>
                        <SettingsProvider>
                            <AuthProvider>
                                <CartProvider>
                                    <AppRouter />
                                </CartProvider>
                            </AuthProvider>
                        </SettingsProvider>
                    </LanguageProvider>
                </ToastProvider>
            </HelmetProvider>
        </QueryClientProvider>
    );
}

export default App;
