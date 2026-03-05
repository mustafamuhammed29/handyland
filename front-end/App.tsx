
import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Accessories } from './components/Accessories';
import { Valuation } from './components/Valuation';
import { Footer } from './components/Footer';
import { Auth } from './components/Auth';
import { RepairGallery } from './components/RepairGallery';
import { Stats } from './components/Stats';
import { Contact } from './components/Contact';
import { CartDrawer } from './components/CartDrawer';
import PaymentSuccess from './PaymentSuccess';
import { Dashboard } from './components/Dashboard';
import { SellDevice } from './pages/SellDevice';
import { MyValuations } from './pages/MyValuations';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';

import { SellerStudio } from './components/SellerStudio';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicLayout } from './components/layouts/PublicLayout';
import { InfoPage } from './components/InfoPage';
import { VerifyEmail } from './components/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmailNotice from './pages/VerifyEmailNotice';
import ForgotPassword from './pages/ForgotPassword';
import SocialAuthCallback from './pages/SocialAuthCallback';
import { LanguageCode, User } from './types';
import { translations } from './i18n';
import { CartProvider, useCart } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GlobalError } from './components/GlobalError';
import { GlobalLoader } from './components/GlobalLoader';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { SEO } from './components/SEO';
import { WhatsAppWidget } from './components/WhatsAppWidget';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { OfflineBanner } from './components/OfflineBanner';
import { PromoModal } from './components/PromoModal';

// Lazy Load Components
const Marketplace = React.lazy(() => import('./components/Marketplace').then(module => ({ default: module.Marketplace })));
const Repair = React.lazy(() => import('./components/Repair').then(module => ({ default: module.Repair })));
const ProductDetails = React.lazy(() => import('./components/ProductDetails').then(module => ({ default: module.ProductDetails })));

const Checkout = React.lazy(() => import('./pages/Checkout').then(module => ({ default: module.Checkout })));
const OrderDetails = React.lazy(() => import('./pages/OrderDetails').then(module => ({ default: module.OrderDetails })));
const GuestTicketTracking = React.lazy(() => import('./pages/GuestTicketTracking').then(module => ({ default: module.GuestTicketTracking })));

const AdminRedirect = () => {
  useEffect(() => {
    window.location.href = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';
  }, []);
  return null;
};

// Home Component to group Home-related sections
const Home = ({ lang }: { lang: LanguageCode }) => {
  const { settings } = useSettings();
  const sections = settings?.sections || { hero: true, stats: true, repairGallery: true, marketplace: true, accessories: true, contact: true };

  return (
    <>
      <SEO
        title="Premium Refurbished Smartphones & Repair Services"
        description="HandyLand offers certified refurbished smartphones, expert repair services, and instant valuations. Shop sustainable tech today."
        canonical="https://handyland.com"
      />
      {sections.hero && <Hero lang={lang} />}
      {sections.stats && <Stats />}
      {sections.repairGallery && (
        <div className="bg-slate-950">
          <RepairGallery lang={lang} />
        </div>
      )}
      {sections.marketplace && (
        <div className="bg-slate-950 py-12 border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-2xl font-bold text-white mb-8 pl-4 border-l-4 border-blue-600 rtl:border-l-0 rtl:border-r-4 rtl:pl-0 rtl:pr-4">
              {translations[lang].market} Highlights
            </h3>
            <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div></div>}>
              <Marketplace lang={lang} />
            </Suspense>
          </div>
        </div>
      )}
      {sections.accessories && <Accessories lang={lang} />}
      {sections.contact && <Contact lang={lang} />}
    </>
  );
};


// AppContent uses the hooks that require the contexts provided in App
function AppContent() {
  const location = useLocation();
  const [lang, setLang] = useState<LanguageCode>('de');
  const { user, setUser, logout } = useAuth(); // Use AuthContext
  const { cart, setIsCartOpen } = useCart(); // FIXED: [Added setIsCartOpen for /cart redirect]

  // Use settings context to check for global load errors
  // This is now safe because AppContent is wrapped by SettingsProvider in App
  const { settings, loading: settingsLoading, error: settingsError } = useSettings();

  // FIXED: [Open cart drawer if navigated from /cart]
  useEffect(() => {
    if (location.state?.message === 'cart_open') {
      setIsCartOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, setIsCartOpen]);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('handyland_lang') as LanguageCode;
    if (savedLang) setLang(savedLang);
  }, []);

  // Sync Document properties with current language
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Dynamically update browser tab title from admin settings
  useEffect(() => {
    if (settings?.siteName) {
      document.title = settings.siteName;
    }
  }, [settings?.siteName]);

  // Handle Global Error
  if (settingsError) {
    return <GlobalError onRetry={() => window.location.reload()} />;
  }

  // Handle Loading - Optional: Show a splash screen
  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans bg-slate-950 selection:bg-blue-500/30 selection:text-blue-200 ${lang === 'ar' ? 'dir-rtl' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <AnnouncementBanner />
      <OfflineBanner />
      <PromoModal />
      <Suspense fallback={<GlobalLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* PUBLIC LAYOUT */}
            <Route
              path="/"
              element={
                <PublicLayout
                  lang={lang}
                  user={user}
                  cartCount={cart.length}
                />
              }
            >
              <Route path="/" element={<PageTransition><Home lang={lang} /></PageTransition>} />
              <Route path="/marketplace" element={<Suspense fallback={<GlobalLoader />}><Marketplace lang={lang} /></Suspense>} />
              <Route path="/marketplace/:id" element={<Suspense fallback={<GlobalLoader />}><ProductDetails lang={lang} /></Suspense>} />
              <Route path="/orders/:id" element={<ProtectedRoute><Suspense fallback={<GlobalLoader />}><OrderDetails /></Suspense></ProtectedRoute>} />
              <Route path="/accessories" element={<PageTransition><Accessories lang={lang} /></PageTransition>} />
              <Route path="/repair" element={<PageTransition><Repair lang={lang} /></PageTransition>} />
              <Route path="/valuation" element={<PageTransition><Valuation lang={lang} /></PageTransition>} />
              <Route path="/sell/:quoteRef" element={<PageTransition><SellDevice /></PageTransition>} />
              <Route path="/products/:id" element={<PageTransition><ProductDetails lang={lang} /></PageTransition>} />
              <Route path="contact" element={<PageTransition><Contact lang={lang} /></PageTransition>} />
              <Route path="checkout" element={<ProtectedRoute><PageTransition><Suspense fallback={<GlobalLoader />}><Checkout lang={lang} /></Suspense></PageTransition></ProtectedRoute>} />
              <Route path="payment-success" element={<PageTransition><PaymentSuccess /></PageTransition>} />
              <Route path="login" element={<PageTransition><Login /></PageTransition>} />
              <Route path="verify-email" element={<PageTransition><VerifyEmail /></PageTransition>} />
              <Route path="verify-email-notice" element={<PageTransition><VerifyEmailNotice /></PageTransition>} />
              <Route path="reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
              <Route path="forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
              <Route path="register" element={<PageTransition><Register /></PageTransition>} />
              <Route path="auth/callback" element={<SocialAuthCallback />} />
              <Route path="/track-repair" element={<PageTransition><Suspense fallback={<GlobalLoader />}><GuestTicketTracking /></Suspense></PageTransition>} />

              {/* UX Report Redirects */}
              <Route path="/products" element={<Navigate to="/marketplace" replace />} />
              <Route path="/cart" element={<Navigate to="/" replace state={{ message: 'cart_open' }} />} /> {/* FIXED: [Route /cart gives feedback by opening cart drawer] */}
              <Route path="/about" element={<Navigate to="/uber-uns" replace />} />
              <Route path="/admin" element={<AdminRedirect />} />

              {/* Dynamic Pages */}
              <Route path="/info" element={<PageTransition><InfoPage lang={lang} /></PageTransition>} />
              {/* 
                Use default exports if available, otherwise use InfoPage or correct imports.
                Assuming TermsAndConditions and PrivacyPolicy are named exports in pages/
             */}
              <Route path="/agb" element={<PageTransition><TermsAndConditions /></PageTransition>} />
              <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />

              <Route path="/datenschutz" element={<PageTransition><InfoPage lang={lang} /></PageTransition>} />
              <Route path="/service" element={<PageTransition><InfoPage lang={lang} /></PageTransition>} />
              <Route path="/kundenservice" element={<PageTransition><InfoPage lang={lang} /></PageTransition>} />
              <Route path="/impressum" element={<PageTransition><InfoPage lang={lang} /></PageTransition>} />
              <Route path="/uber-uns" element={<PageTransition><InfoPage lang={lang} /></PageTransition>} />
              <Route path="/page/:slug" element={<PageTransition><InfoPage lang={lang} /></PageTransition>} />
            </Route>

            {/* PROTECTED ROUTES */}
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<PageTransition><Dashboard user={user} logout={logout} /></PageTransition>} />
              <Route path="dashboard/valuations" element={<PageTransition><MyValuations /></PageTransition>} />
              <Route path="seller" element={<PageTransition><SellerStudio lang={lang} /></PageTransition>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>

        {/* Cart Drawer */}
        <CartDrawer lang={lang} />

        {/* WhatsApp Floating Icon */}
        <WhatsAppWidget />
      </Suspense>
    </div >
  );
}

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60 * 1000, // 1 minute default
    },
  },
});

// Main App Component that provides context
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* @ts-ignore */}
      <HelmetProvider context={{}}>
        <ToastProvider>
          <SettingsProvider>
            <AuthProvider>
              <CartProvider>
                <AppContent />
              </CartProvider>
            </AuthProvider>
          </SettingsProvider>
        </ToastProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
