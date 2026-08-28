import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { useLang } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { GlobalError } from '../components/GlobalError';
import { SEO } from '../components/SEO';
import { AnnouncementBanner } from '../components/AnnouncementBanner';
import { OfflineBanner } from '../components/OfflineBanner';

const CartDrawer = React.lazy(() => import('../components/CartDrawer').then(m => ({ default: m.CartDrawer })));
const WhatsAppWidget = React.lazy(() => import('../components/WhatsAppWidget').then(m => ({ default: m.WhatsAppWidget })));
const PromoModal = React.lazy(() => import('../components/PromoModal').then(m => ({ default: m.PromoModal })));

import { getPublicRoutes } from './PublicRoutes';
import { getProtectedRoutes } from './ProtectedRoutes';
import { AdminRedirect } from './AdminRoutes';

const NotFound = React.lazy(() => import('../pages/NotFound'));
const MaintenancePage = React.lazy(() => import('../pages/MaintenancePage'));

const RouteFallback = () => (
    <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-700 border-t-brand-primary rounded-full animate-spin"></div>
    </div>
);

export const AppRouter = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { lang } = useLang();
    const { user, logout } = useAuth();
    const { cart } = useCart();

    const { settings, loading: settingsLoading, error: settingsError } = useSettings();

    // Scroll to top on route change
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    // ── Global Maintenance Gate (Fail-Open) ──────────────────────────────────
    // Initializes to false so routes render immediately without blocking.
    // Checks /api/maintenance-info with a ≤ 2.5s timeout.
    const [isMaintenanceActive, setIsMaintenanceActive] = React.useState<boolean>(false);
    const [isAdminBypass, setIsAdminBypass] = React.useState<boolean>(false);

    useEffect(() => {
        let cancelled = false;
        const checkMaintenance = async () => {
            const controller = new AbortController();
            const timeoutTimer = setTimeout(() => controller.abort(), 2500);

            try {
                // Use the custom api instance to ensure the correct base URL is used
                const data = await api.get('/api/maintenance-info', {
                    headers: { 'Cache-Control': 'no-store', 'Pragma': 'no-cache' },
                    signal: controller.signal,
                    timeout: 2500
                });
                
                if (!cancelled) {
                    setIsMaintenanceActive((data as any).maintenance === true);
                    setIsAdminBypass((data as any).bypassActive === true);
                }
            } catch {
                // If the endpoint itself fails or times out, fail open
                if (!cancelled) {
                    setIsMaintenanceActive(false);
                    setIsAdminBypass(false);
                }
            } finally {
                clearTimeout(timeoutTimer);
            }
        };
        checkMaintenance();

        // Re-check every 15 seconds in case admin toggles maintenance
        const interval = setInterval(checkMaintenance, 15000);
        return () => { cancelled = true; clearInterval(interval); };
    }, []);

    useEffect(() => {
        const handleNavigation = (e: Event) => {
            const customEvent = e as CustomEvent<string>;
            if (customEvent.detail) {
                navigate(customEvent.detail, { replace: true });
            }
        };
        window.addEventListener('handyland:navigate', handleNavigation);
        return () => window.removeEventListener('handyland:navigate', handleNavigation);
    }, [navigate]);

    if (isMaintenanceActive) {
        // Maintenance is ON — show maintenance page on EVERY route
        return <Suspense fallback={<RouteFallback />}><MaintenancePage /></Suspense>;
    }

    if (settingsError) {
        const handleRetry = () => {
            const retries = parseInt(sessionStorage.getItem('sys_retry_count') || '0');
            if (retries >= 3) {
                window.location.href = '/maintenance';
            } else {
                sessionStorage.setItem('sys_retry_count', (retries + 1).toString());
                window.location.reload();
            }
        };

        return <GlobalError onRetry={handleRetry} />;
    }

    if (settingsLoading) {
        return (
            <div className="min-h-[100dvh] bg-white dark:bg-slate-950 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className={`min-h-[100dvh] font-sans bg-transparent selection:bg-brand-primary/30 selection:text-brand-primary ${(lang === 'ar' || lang === 'fa') ? 'dir-rtl' : ''}`} dir={(lang === 'ar' || lang === 'fa') ? 'rtl' : 'ltr'}>
            <SEO />
            {isAdminBypass && (
                <div className="bg-amber-500 text-slate-900 px-4 py-2.5 text-center font-bold relative z-[9999] shadow-lg flex items-center justify-center gap-3">
                    <span className="text-xl animate-bounce">⚠️</span>
                    Wartungsmodus ist AKTIV! Sie umgehen ihn als Admin. Kunden sehen die Wartungsseite.
                </div>
            )}
            {!['/dashboard', '/seller'].some(p => location.pathname.startsWith(p)) && (
                <>
                    <AnnouncementBanner />
                    <Suspense fallback={null}>
                        <PromoModal />
                    </Suspense>
                </>
            )}
            <OfflineBanner />
            <Suspense fallback={<RouteFallback />}>
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        {getPublicRoutes({ settings, lang, user, cartCount: cart.length })}
                        {getProtectedRoutes({ user, logout, lang })}
                        
                        <Route path="/admin/*" element={<AdminRedirect />} />
                        <Route path="/maintenance" element={<Navigate to="/" replace />} />
                        <Route path="*" element={<Suspense fallback={<RouteFallback />}><NotFound /></Suspense>} />
                    </Routes>
                </AnimatePresence>
            </Suspense>

            {/* CartDrawer: hide on cart, checkout, dashboard, seller pages */}
            {!['/cart', '/checkout', '/dashboard', '/seller'].some(p => location.pathname.startsWith(p)) && (
                <Suspense fallback={null}>
                    <CartDrawer />
                </Suspense>
            )}
            {/* WhatsApp Widget: hide on dashboard and seller (clean admin-like UX) */}
            {!['/dashboard', '/seller'].some(p => location.pathname.startsWith(p)) && (
                <Suspense fallback={null}>
                    <WhatsAppWidget />
                </Suspense>
            )}
        </div>
    );
};
