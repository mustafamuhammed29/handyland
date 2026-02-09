import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Marketplace } from './components/Marketplace';
import { Accessories } from './components/Accessories';
import { Repair } from './components/Repair';
import { Valuation } from './components/Valuation';
import { Footer } from './components/Footer';
import { Auth } from './components/Auth';
import { RepairGallery } from './components/RepairGallery';
import { Stats } from './components/Stats';
import { Contact } from './components/Contact';
import { CartDrawer } from './components/CartDrawer';
import { Checkout } from './components/Checkout';
import PaymentSuccess from './PaymentSuccess';
import { ProductDetails } from './components/ProductDetails';
import { Dashboard } from './components/Dashboard';
import { SellDevice } from './pages/SellDevice';
import { NotFound } from './pages/NotFound';

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
            <h3 className="text-2xl font-bold text-white mb-8 pl-4 border-l-4 border-blue-600">
              {translations[lang].market} Highlights
            </h3>
            <Marketplace lang={lang} />
          </div>
        </div>
      )}
      {sections.accessories && <Accessories lang={lang} />}
      {sections.contact && <Contact lang={lang} />}
    </>
  );
};


function App() {
  const navigate = useNavigate();

  const [view, setViewState] = useState<ViewState>(ViewState.HOME);
  const [lang, setLang] = useState<LanguageCode>('de');
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showCart, setShowCart] = useState(false);

  // Restore session on load
  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Legacy setView for components that still rely on it
  const setView = (view: ViewState) => {
    setViewState(view);
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
  const toggleCart = () => setShowCart(!showCart);

  return (
    <ToastProvider>
      <SettingsProvider>
        <CartProvider>
          {/* Cart Drawer is now handled inside PublicLayout or globally if needed, let's keep it global for now or move to PublicLayout */}
          {/* Actually, the request is to separate completely. Admin shouldn't have cart drawer. */}
          <div className={`min-h-screen font-sans bg-slate-950 selection:bg-blue-500/30 selection:text-blue-200 ${lang === 'ar' ? 'dir-rtl' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <Routes>
              {/* PUBLIC LAYOUT */}
              <Route
                path="/"
                element={
                  <PublicLayout
                    view={ViewState.HOME} // Using ViewState.HOME as 'view' is not defined in App's scope
                    setView={setView}
                    lang={lang}
                    user={user}
                    cartCount={10}
                    toggleCart={toggleCart}
                    toggleAuth={toggleAuth}
                  />
                }
              >
                <Route path="/" element={<Home setView={setView} lang={lang} />} />
                <Route path="/marketplace" element={<Marketplace lang={lang} />} />
                <Route path="/accessories" element={<Accessories lang={lang} />} />
                <Route path="/repair" element={<Repair lang={lang} />} />
                <Route path="/valuation" element={<Valuation lang={lang} />} />
                <Route path="/sell/:quoteRef" element={<SellDevice />} />
                <Route path="shop" element={<Accessories lang={lang} />} />
                <Route path="products/:id" element={<ProductDetails lang={lang} />} />
                <Route path="/contact" element={<Contact lang={lang} />} /> {/* Kept from original */}
                <Route path="checkout" element={<Checkout lang={lang} setView={setView} />} />
                <Route path="payment-success" element={<PaymentSuccess />} />
                <Route path="login" element={<Auth setView={setView} lang={lang} setUser={setUser} />} />
                <Route path="verify-email" element={<VerifyEmail />} />
                <Route path="verify-email-notice" element={<VerifyEmailNotice />} />
                <Route path="reset-password" element={<ResetPassword />} />

                {/* Dynamic Pages */}
                <Route path="/info" element={<InfoPage lang={lang} />} />
                <Route path="/agb" element={<InfoPage lang={lang} />} />
                <Route path="/privacy" element={<InfoPage lang={lang} />} />
                <Route path="/datenschutz" element={<InfoPage lang={lang} />} />
                <Route path="/service" element={<InfoPage lang={lang} />} />
                <Route path="/kundenservice" element={<InfoPage lang={lang} />} />
                <Route path="/impressum" element={<InfoPage lang={lang} />} />
                <Route path="/uber-uns" element={<InfoPage lang={lang} />} />
                <Route path="/page/:slug" element={<InfoPage lang={lang} />} />
              </Route>

              {/* PROTECTED ROUTES */}
              <Route element={<ProtectedRoute user={user} />}>
                <Route path="dashboard" element={<Dashboard user={user} setView={setView} logout={() => setUser(null)} />} />
                <Route path="seller" element={<SellerStudio lang={lang} setView={setView} />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </CartProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}

export default App;
