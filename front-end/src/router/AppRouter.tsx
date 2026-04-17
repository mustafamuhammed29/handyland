import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { CartDrawer } from '../components/CartDrawer';
import PaymentSuccess from '../PaymentSuccess';
import NotFound from '../pages/NotFound';
import MaintenancePage from '../pages/MaintenancePage';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsAndConditions from '../pages/TermsAndConditions';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { PublicLayout } from '../components/layouts/PublicLayout';
import { InfoPage } from '../components/InfoPage';
import { VerifyEmail } from '../components/VerifyEmail';
import ResetPassword from '../pages/ResetPassword';
import Login from '../pages/Login';
import Register from '../pages/Register';
import VerifyEmailNotice from '../pages/VerifyEmailNotice';
import ForgotPassword from '../pages/ForgotPassword';
import SocialAuthCallback from '../pages/SocialAuthCallback';
import { LanguageCode } from '../types';
import { useLang } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { GlobalError } from '../components/GlobalError';
import { GlobalLoader } from '../components/GlobalLoader';
import { SEO } from '../components/SEO';
import { WhatsAppWidget } from '../components/WhatsAppWidget';
import { AnnouncementBanner } from '../components/AnnouncementBanner';
import { OfflineBanner } from '../components/OfflineBanner';
import ErrorBoundary from '../components/ErrorBoundary';
import { PromoModal } from '../components/PromoModal';

// FIXED M-1: Lazy-load heavy components to reduce initial bundle size
const Hero = React.lazy(() => import('../components/Hero').then(m => ({ default: m.Hero })));
const Accessories = React.lazy(() => import('../components/Accessories').then(m => ({ default: m.Accessories })));
const Valuation = React.lazy(() => import('../components/Valuation').then(m => ({ default: m.Valuation })));
const Contact = React.lazy(() => import('../components/Contact').then(m => ({ default: m.Contact })));
const Stats = React.lazy(() => import('../components/Stats').then(m => ({ default: m.Stats })));
const RepairGallery = React.lazy(() => import('../components/RepairGallery').then(m => ({ default: m.RepairGallery })));
const SellDevice = React.lazy(() => import('../pages/SellDevice').then(m => ({ default: m.SellDevice })));
const MyValuations = React.lazy(() => import('../pages/MyValuations').then(m => ({ default: m.MyValuations })));
const SellerStudio = React.lazy(() => import('../components/SellerStudio').then(m => ({ default: m.SellerStudio })));
const ComparePage = React.lazy(() => import('../pages/ComparePage').then(m => ({ default: m.ComparePage })));
// Lazy Load Components
const Marketplace = React.lazy(() => import('../components/Marketplace').then(module => ({ default: module.Marketplace })));
const Repair = React.lazy(() => import('../components/Repair').then(module => ({ default: module.Repair })));
const ProductDetails = React.lazy(() => import('../components/ProductDetails').then(module => ({ default: module.ProductDetails })));
const AccessoryDetails = React.lazy(() => import('../components/AccessoryDetails').then(module => ({ default: module.AccessoryDetails })));
const Checkout = React.lazy(() => import('../pages/Checkout').then(module => ({ default: module.Checkout })));
const CartPage = React.lazy(() => import('../pages/Cart').then(module => ({ default: module.Cart })));
const OrderDetails = React.lazy(() => import('../pages/OrderDetails').then(module => ({ default: module.OrderDetails })));
const GuestTicketTracking = React.lazy(() => import('../pages/GuestTicketTracking').then(module => ({ default: module.GuestTicketTracking })));
const Dashboard = React.lazy(() => import('../components/Dashboard').then(module => ({ default: module.Dashboard })));

const AdminRedirect = () => {
    const adminUrl = import.meta.env.VITE_ADMIN_URL;
    const isProduction = import.meta.env.PROD;

    useEffect(() => {
        // In production, only redirect if VITE_ADMIN_URL is explicitly set.
        // Falling back to localhost in production would silently break for end-users.
        const target = adminUrl || (isProduction ? null : 'http://localhost:3001');
        if (target) {
            window.location.href = target;
        }
    }, [adminUrl, isProduction]);

    if (!adminUrl && isProduction) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-8 text-center">
                <div className="text-4xl">⚙️</div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Admin panel not configured</h1>
                <p className="text-slate-500 text-sm">Please set <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">VITE_ADMIN_URL</code> in your environment.</p>
            </div>
        );
    }

    return null;
};

// Home Component to group Home-related sections
const Home = ({ lang }: { lang: LanguageCode }) => {
    const { settings } = useSettings();
    const { t } = useTranslation();
    const sections = settings?.sections || { hero: true, stats: true, repairGallery: true, marketplace: true, accessories: true, contact: true };

    return (
        <>
            <SEO canonical="https://handyland.com" />
            {sections.hero && <Hero lang={lang} />}
            {sections.stats && <Stats />}
            {sections.repairGallery && (
                <div className="bg-slate-50 dark:bg-slate-950">
                    <RepairGallery />
                </div>
            )}
            {sections.marketplace && (
                <div className="bg-slate-50 dark:bg-slate-950 py-12 border-t border-slate-200 dark:border-slate-900">
                    <div className="max-w-7xl mx-auto px-4">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 pl-4 border-l-4 border-blue-600 rtl:border-l-0 rtl:border-r-4 rtl:pl-0 rtl:pr-4">
                            {t('market', 'Market')} Highlights
                        </h3>
                        <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div></div>}>
                            <Marketplace lang={lang} hideSEO={true} />
                        </Suspense>
                    </div>
                </div>
            )}
            {sections.accessories && <Accessories lang={lang} />}
            {sections.contact && <Contact />}
        </>
    );
};

export const AppRouter = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { lang } = useLang();
    const { user, logout } = useAuth();
    const { cart } = useCart();

    const { settings, loading: settingsLoading, error: settingsError } = useSettings();

    // ── Global Maintenance Gate ─────────────────────────────────────────────
    // This runs INDEPENDENTLY of settings and checks the always-available
    // /api/maintenance-info endpoint. If maintenance is active, ALL routes
    // are blocked and MaintenancePage is shown regardless of URL.
    const [isMaintenanceActive, setIsMaintenanceActive] = React.useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;
        const checkMaintenance = async () => {
            try {
                const res = await fetch('/api/maintenance-info');
                const data = await res.json();
                if (!cancelled) {
                    setIsMaintenanceActive(data.maintenance === true);
                }
            } catch {
                // If the endpoint itself fails, don't block the site
                if (!cancelled) setIsMaintenanceActive(false);
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

    // Document title is now purely handled by SEO.tsx and Helmet Provider

    // ── MAINTENANCE GATE: Block ALL routes if maintenance is active ──────
    if (isMaintenanceActive === null) {
        // Still checking maintenance status — show a brief loading state
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (isMaintenanceActive) {
        // Maintenance is ON — show maintenance page on EVERY route
        return <MaintenancePage />;
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
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen font-sans bg-transparent selection:bg-brand-primary/30 selection:text-brand-primary ${lang === 'ar' ? 'dir-rtl' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <SEO />
            <AnnouncementBanner />
            <OfflineBanner />
            <PromoModal />
            <Suspense fallback={<GlobalLoader />}>
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<PublicLayout lang={lang} user={user} cartCount={cart.length} />}>
                            <Route path="/" element={<PageTransition><Home lang={lang} /></PageTransition>} />
                            <Route path="/marketplace" element={<PageTransition><Suspense fallback={<GlobalLoader />}><Marketplace lang={lang} /></Suspense></PageTransition>} />
                            <Route path="/marketplace/:id" element={<PageTransition><Suspense fallback={<GlobalLoader />}><ProductDetails /></Suspense></PageTransition>} />
                            <Route path="/orders/:id" element={<ProtectedRoute><Suspense fallback={<GlobalLoader />}><OrderDetails /></Suspense></ProtectedRoute>} />
                            <Route path="/accessories" element={<PageTransition><Suspense fallback={<GlobalLoader />}><Accessories lang={lang} /></Suspense></PageTransition>} />
                            <Route path="/repair" element={<PageTransition><Suspense fallback={<GlobalLoader />}><Repair lang={lang} /></Suspense></PageTransition>} />
                            <Route path="/valuation" element={<PageTransition><Suspense fallback={<GlobalLoader />}><Valuation lang={lang} /></Suspense></PageTransition>} />
                            <Route path="/sell/:quoteRef" element={<PageTransition><Suspense fallback={<GlobalLoader />}><SellDevice /></Suspense></PageTransition>} />
                            <Route path="/products/:id" element={<PageTransition><Suspense fallback={<GlobalLoader />}><ProductDetails /></Suspense></PageTransition>} />
                            <Route path="/accessories/:id" element={<PageTransition><Suspense fallback={<GlobalLoader />}><AccessoryDetails /></Suspense></PageTransition>} />
                            <Route path="/compare" element={<PageTransition><Suspense fallback={<GlobalLoader />}><ComparePage /></Suspense></PageTransition>} />
                            <Route path="/contact" element={<PageTransition><Suspense fallback={<GlobalLoader />}><Contact /></Suspense></PageTransition>} />
                            <Route path="/checkout" element={<ProtectedRoute><ErrorBoundary><PageTransition><Suspense fallback={<GlobalLoader />}><Checkout /></Suspense></PageTransition></ErrorBoundary></ProtectedRoute>} />
                            <Route path="/payment-success" element={<PageTransition><PaymentSuccess /></PageTransition>} />
                            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                            <Route path="/verify-email" element={<PageTransition><VerifyEmail /></PageTransition>} />
                            <Route path="/verify-email-notice" element={<PageTransition><VerifyEmailNotice /></PageTransition>} />
                            <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
                            <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
                            <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
                            <Route path="/auth/callback" element={<SocialAuthCallback />} />
                            <Route path="/track-repair" element={<PageTransition><Suspense fallback={<GlobalLoader />}><GuestTicketTracking /></Suspense></PageTransition>} />

                            <Route path="/products" element={<Navigate to="/marketplace" replace />} />
                            <Route path="/cart" element={<ErrorBoundary><PageTransition><Suspense fallback={<GlobalLoader />}><CartPage lang={lang} /></Suspense></PageTransition></ErrorBoundary>} />
                            <Route path="/about" element={<Navigate to="/uber-uns" replace />} />
                            <Route path="/admin" element={<AdminRedirect />} />

                            <Route path="/info" element={<PageTransition><InfoPage /></PageTransition>} />
                            <Route path="/agb" element={<PageTransition><TermsAndConditions /></PageTransition>} />
                            <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
                            <Route path="/datenschutz" element={<PageTransition><InfoPage /></PageTransition>} />
                            <Route path="/service" element={<PageTransition><InfoPage /></PageTransition>} />
                            <Route path="/kundenservice" element={<PageTransition><InfoPage /></PageTransition>} />
                            <Route path="/impressum" element={<PageTransition><InfoPage /></PageTransition>} />
                            <Route path="/uber-uns" element={<PageTransition><InfoPage /></PageTransition>} />
                            <Route path="/page/:slug" element={<PageTransition><InfoPage /></PageTransition>} />
                        </Route>

                        <Route element={<ProtectedRoute />}>
                            <Route path="/dashboard" element={<PageTransition><Suspense fallback={<GlobalLoader />}><Dashboard user={user} logout={logout} /></Suspense></PageTransition>} />
                            <Route path="/dashboard/valuations" element={<PageTransition><Suspense fallback={<GlobalLoader />}><MyValuations /></Suspense></PageTransition>} />
                            <Route path="/seller" element={<PageTransition><Suspense fallback={<GlobalLoader />}><SellerStudio lang={lang} /></Suspense></PageTransition>} />
                        </Route>

                        <Route path="/maintenance" element={<MaintenancePage />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </AnimatePresence>
            </Suspense>

            {location.pathname !== '/cart' && location.pathname !== '/checkout' && <CartDrawer />}
            <WhatsAppWidget />
        </div>
    );
};
