
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
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';

import { SellerStudio } from './components/SellerStudio';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicLayout } from './components/layouts/PublicLayout';
import { InfoPage } from './components/InfoPage';
import { VerifyEmail } from './components/VerifyEmail';
import { ResetPassword } from './components/ResetPassword';
import Login from './Login';
import Register from './Register';
import VerifyEmailNotice from './VerifyEmailNotice';
import ForgotPassword from './ForgotPassword';
import { ViewState, LanguageCode, User } from './types';
import { translations } from './i18n';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GlobalError } from './components/GlobalError';
import { GlobalLoader } from './components/GlobalLoader';

// Lazy Load Components
const Marketplace = React.lazy(() => import('./components/Marketplace').then(module => ({ default: module.Marketplace })));
const Repair = React.lazy(() => import('./components/Repair').then(module => ({ default: module.Repair })));
const ProductDetails = React.lazy(() => import('./components/ProductDetails').then(module => ({ default: module.ProductDetails })));

const Checkout = React.lazy(() => import('./pages/Checkout').then(module => ({ default: module.Checkout })));
const OrderDetails = React.lazy(() => import('./pages/OrderDetails').then(module => ({ default: module.OrderDetails })));

// Home Component to group Home-related sections
const Home = ({ setView, lang }: { setView: any, lang: LanguageCode }) => {
  const { settings } = useSettings();
  const sections = settings?.sections || { hero: true, stats: true, repairGallery: true, marketplace: true, accessories: true, contact: true };

  return (
    <>
      {sections.hero && <Hero setView={setView} lang={lang} />}
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
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [lang, setLang] = useState<LanguageCode>('de');
  const [showAuth, setShowAuth] = useState(false);
  const { user, setUser } = useAuth(); // Use AuthContext

  // Use settings context to check for global load errors
  // This is now safe because AppContent is wrapped by SettingsProvider in App
  const { loading: settingsLoading, error: settingsError } = useSettings();

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('handyland_lang') as LanguageCode;
    if (savedLang) setLang(savedLang);
  }, []);

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

  // Legacy setView for components that still rely on it
  const setViewLegacy = (view: ViewState) => {
    setView(view);
    switch (view) {
      case ViewState.HOME: navigate('/'); break;
      case ViewState.MARKETPLACE: navigate('/marketplace'); break;
      case ViewState.REPAIR: navigate('/repair'); break;
      case ViewState.VALUATION: navigate('/valuation'); break;
      case ViewState.LOGIN: navigate('/login'); break;
      case ViewState.CHECKOUT: navigate('/checkout'); break;
      case ViewState.DASHBOARD: navigate('/dashboard'); break;
      case ViewState.SELLER_STUDIO: navigate('/seller'); break;
      case ViewState.AGB: navigate('/agb'); break;
      case ViewState.PRIVACY: navigate('/privacy'); break;
      case ViewState.SERVICE: navigate('/service'); break;
      case ViewState.IMPRESSUM: navigate('/impressum'); break;
      case ViewState.ABOUT: navigate('/about'); break;
    }
  };

  const toggleAuth = () => setShowAuth(!showAuth);

  return (
    <div className={`min-h-screen font-sans bg-slate-950 selection:bg-blue-500/30 selection:text-blue-200 ${lang === 'ar' ? 'dir-rtl' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Suspense fallback={<GlobalLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* PUBLIC LAYOUT */}
            <Route
              path="/"
              element={
                <PublicLayout
                  view={ViewState.HOME}
                  setView={setViewLegacy}
                  lang={lang}
                  user={user}
                  cartCount={10}
                  toggleAuth={toggleAuth}
                />
              }
            >
              <Route path="/" element={<PageTransition><Home setView={setViewLegacy} lang={lang} /></PageTransition>} />
              <Route path="/marketplace" element={<Suspense fallback={<GlobalLoader />}><Marketplace lang={lang} /></Suspense>} />
              <Route path="/marketplace/:id" element={<Suspense fallback={<GlobalLoader />}><ProductDetails lang={lang} /></Suspense>} />
              <Route path="/orders/:id" element={<ProtectedRoute user={user}><Suspense fallback={<GlobalLoader />}><OrderDetails /></Suspense></ProtectedRoute>} />
              <Route path="/accessories" element={<PageTransition><Accessories lang={lang} /></PageTransition>} />
              <Route path="/repair" element={<PageTransition><Repair lang={lang} /></PageTransition>} />
              <Route path="/valuation" element={<PageTransition><Valuation lang={lang} /></PageTransition>} />
              <Route path="/sell/:quoteRef" element={<PageTransition><SellDevice /></PageTransition>} />
              <Route path="shop" element={<PageTransition><Accessories lang={lang} /></PageTransition>} />
              <Route path="products/:id" element={<PageTransition><ProductDetails lang={lang} /></PageTransition>} />
              <Route path="contact" element={<PageTransition><Contact lang={lang} /></PageTransition>} />
              <Route path="checkout" element={<ProtectedRoute user={user}><PageTransition><Suspense fallback={<GlobalLoader />}><Checkout lang={lang} /></Suspense></PageTransition></ProtectedRoute>} />
              <Route path="payment-success" element={<PageTransition><PaymentSuccess /></PageTransition>} />
              <Route path="login" element={<PageTransition><Auth setView={setViewLegacy} lang={lang} setUser={setUser} /></PageTransition>} />
              <Route path="verify-email" element={<PageTransition><VerifyEmail /></PageTransition>} />
              <Route path="verify-email-notice" element={<PageTransition><VerifyEmailNotice /></PageTransition>} />
              <Route path="reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />

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
            <Route element={<ProtectedRoute user={user} />}>
              <Route path="dashboard" element={<PageTransition><Dashboard user={user} setView={setViewLegacy} logout={() => setUser(null)} /></PageTransition>} />
              <Route path="seller" element={<PageTransition><SellerStudio lang={lang} setView={setViewLegacy} /></PageTransition>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>

        {/* Cart Drawer */}
        <CartDrawer lang={lang} setView={setViewLegacy} />
      </Suspense>
    </div >
  );
}

// Main App Component that provides context
function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}

export default App;
