import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { CartDrawer } from '../components/CartDrawer';
import { useLang } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { GlobalError } from '../components/GlobalError';
import { GlobalLoader } from '../components/GlobalLoader';
import { SEO } from '../components/SEO';
import { WhatsAppWidget } from '../components/WhatsAppWidget';
import { AnnouncementBanner } from '../components/AnnouncementBanner';
import { OfflineBanner } from '../components/OfflineBanner';
import { PromoModal } from '../components/PromoModal';

import { getPublicRoutes } from './PublicRoutes';
import { getProtectedRoutes } from './ProtectedRoutes';
import { AdminRedirect } from './AdminRoutes';

const NotFound = React.lazy(() => import('../pages/NotFound'));
const MaintenancePage = React.lazy(() => import('../pages/MaintenancePage'));

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

    // ── Global Maintenance Gate ─────────────────────────────────────────────
    // This runs INDEPENDENTLY of settings and checks the always-available
    // /api/maintenance-info endpoint. If maintenance is active, ALL routes
    // are blocked and MaintenancePage is shown regardless of URL.
    const [isMaintenanceActive, setIsMaintenanceActive] = React.useState<boolean | null>(null);
    const [isAdminBypass, setIsAdminBypass] = React.useState<boolean>(false);

    useEffect(() => {
        let cancelled = false;
        const checkMaintenance = async () => {
            try {
                // Use the custom api instance to ensure the correct base URL is used
                const data = await api.get('/api/maintenance-info', {
                    headers: { 'Cache-Control': 'no-store', 'Pragma': 'no-cache' }
                });
                
                if (!cancelled) {
                    setIsMaintenanceActive((data as any).maintenance === true);
                    setIsAdminBypass((data as any).bypassActive === true);
                }
            } catch {
                // If the endpoint itself fails, don't block the site
                if (!cancelled) {
                    setIsMaintenanceActive(false);
                    setIsAdminBypass(false);
                }
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

    // ── MAINTENANCE GATE: Block ALL routes if maintenance is active ──────
    if (isMaintenanceActive === null) {
        // Still checking maintenance status — show a brief loading state
        return (
            <div className="min-h-[100dvh] bg-slate-950 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (isMaintenanceActive) {
        // Maintenance is ON — show maintenance page on EVERY route
        return <Suspense fallback={<GlobalLoader />}><MaintenancePage /></Suspense>;
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
        <div className={`min-h-[100dvh] font-sans bg-transparent selection:bg-brand-primary/30 selection:text-brand-primary ${lang === 'ar' ? 'dir-rtl' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
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
                    <PromoModal />
                </>
            )}
            <OfflineBanner />
            <Suspense fallback={<GlobalLoader />}>
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        {getPublicRoutes({ settings, lang, user, cartCount: cart.length })}
                        {getProtectedRoutes({ user, logout, lang })}
                        
                        <Route path="/admin/*" element={<AdminRedirect />} />
                        <Route path="/maintenance" element={<Navigate to="/" replace />} />
                        <Route path="*" element={<Suspense fallback={<GlobalLoader />}><NotFound /></Suspense>} />
                    </Routes>
                </AnimatePresence>
            </Suspense>

            {/* CartDrawer: hide on cart, checkout, dashboard, seller pages */}
            {!['/cart', '/checkout', '/dashboard', '/seller'].some(p => location.pathname.startsWith(p)) && <CartDrawer />}
            {/* WhatsApp Widget: hide on dashboard and seller (clean admin-like UX) */}
            {!['/dashboard', '/seller'].some(p => location.pathname.startsWith(p)) && <WhatsAppWidget />}
        </div>
    );
};
