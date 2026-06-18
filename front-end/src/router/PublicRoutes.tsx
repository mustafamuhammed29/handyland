import React, { Suspense } from 'react';
import { Route, Navigate, useParams } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { GlobalLoader } from '../components/GlobalLoader';
import { PublicLayout } from '../components/layouts/PublicLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import ErrorBoundary from '../components/ErrorBoundary';

const PaymentSuccess = React.lazy(() => import('../pages/PaymentSuccess'));
const PrivacyPolicy = React.lazy(() => import('../pages/PrivacyPolicy'));
const TermsAndConditions = React.lazy(() => import('../pages/TermsAndConditions'));
const InfoPage = React.lazy(() => import('../components/InfoPage').then(module => ({ default: module.InfoPage })));
const VerifyEmail = React.lazy(() => import('../components/VerifyEmail').then(module => ({ default: module.VerifyEmail })));
const ResetPassword = React.lazy(() => import('../pages/ResetPassword'));
const Login = React.lazy(() => import('../pages/Login'));
const Register = React.lazy(() => import('../pages/Register'));
const VerifyEmailNotice = React.lazy(() => import('../pages/VerifyEmailNotice'));
const ForgotPassword = React.lazy(() => import('../pages/ForgotPassword'));
const SocialAuthCallback = React.lazy(() => import('../pages/SocialAuthCallback'));
const Marketplace = React.lazy(() => import('../components/Marketplace').then(module => ({ default: module.Marketplace })));
const Repair = React.lazy(() => import('../components/Repair').then(module => ({ default: module.Repair })));
const ProductDetails = React.lazy(() => import('../components/ProductDetails').then(module => ({ default: module.ProductDetails })));
const AccessoryDetails = React.lazy(() => import('../components/AccessoryDetails').then(module => ({ default: module.AccessoryDetails })));
const Checkout = React.lazy(() => import('../pages/Checkout').then(module => ({ default: module.Checkout })));
const CartPage = React.lazy(() => import('../pages/Cart').then(module => ({ default: module.Cart })));
const OrderDetails = React.lazy(() => import('../pages/OrderDetails').then(module => ({ default: module.OrderDetails })));
const GuestTicketTracking = React.lazy(() => import('../pages/GuestTicketTracking').then(module => ({ default: module.GuestTicketTracking })));
const Accessories = React.lazy(() => import('../components/Accessories').then(m => ({ default: m.Accessories })));
const Valuation = React.lazy(() => import('../components/Valuation').then(m => ({ default: m.Valuation })));
const Contact = React.lazy(() => import('../components/Contact').then(m => ({ default: m.Contact })));
const SellDevice = React.lazy(() => import('../pages/SellDevice').then(m => ({ default: m.SellDevice })));
const ComparePage = React.lazy(() => import('../pages/ComparePage').then(m => ({ default: m.ComparePage })));
import { Home } from './Home';

// Legacy Redirect Helpers
const LegacyOrderRedirect = () => {
    const { id } = useParams();
    if (!id || id === ':id') return <Navigate to="/dashboard?tab=orders" replace />;
    return <Navigate to={`/orders/${id}`} replace />;
};

interface PublicRoutesProps {
    settings: any;
    lang: any;
    user: any;
    cartCount: number;
}

export const getPublicRoutes = ({ settings, lang, user, cartCount }: PublicRoutesProps) => {
    return (
        <Route path="/" element={<PublicLayout lang={lang} user={user} cartCount={cartCount} />}>
            <Route path="/" element={<PageTransition><Home lang={lang} /></PageTransition>} />

            {/* Core Module Protection */}
            <Route path="/marketplace" element={settings.sections?.marketplacePage !== false ? <PageTransition><Suspense fallback={<GlobalLoader />}><Marketplace lang={lang} /></Suspense></PageTransition> : <Navigate to="/" replace />} />
            <Route path="/marketplace/:id" element={settings.sections?.marketplacePage !== false ? <PageTransition><Suspense fallback={<GlobalLoader />}><ProductDetails /></Suspense></PageTransition> : <Navigate to="/" replace />} />
            <Route path="/products/:id" element={settings.sections?.marketplacePage !== false ? <PageTransition><Suspense fallback={<GlobalLoader />}><ProductDetails /></Suspense></PageTransition> : <Navigate to="/" replace />} />
            <Route path="/products" element={<Navigate to="/marketplace" replace />} />

            <Route path="/repair" element={settings.sections?.repairPage !== false ? <PageTransition><Suspense fallback={<GlobalLoader />}><Repair lang={lang} /></Suspense></PageTransition> : <Navigate to="/" replace />} />
            <Route path="/track-repair" element={settings.sections?.trackRepairPage !== false ? <PageTransition><Suspense fallback={<GlobalLoader />}><GuestTicketTracking /></Suspense></PageTransition> : <Navigate to="/" replace />} />

            <Route path="/valuation" element={settings.sections?.valuationPage !== false ? <PageTransition><Suspense fallback={<GlobalLoader />}><Valuation lang={lang} /></Suspense></PageTransition> : <Navigate to="/" replace />} />
            <Route path="/sell/:quoteRef" element={settings.sections?.valuationPage !== false ? <PageTransition><Suspense fallback={<GlobalLoader />}><SellDevice /></Suspense></PageTransition> : <Navigate to="/" replace />} />

            <Route path="/login" element={settings.sections?.authSystem !== false ? <PageTransition><Suspense fallback={<GlobalLoader />}><Login /></Suspense></PageTransition> : <Navigate to="/" replace />} />
            <Route path="/register" element={settings.sections?.authSystem !== false ? <PageTransition><Suspense fallback={<GlobalLoader />}><Register /></Suspense></PageTransition> : <Navigate to="/" replace />} />
            <Route path="/reset-password" element={settings.sections?.authSystem !== false ? <PageTransition><Suspense fallback={<GlobalLoader />}><ResetPassword /></Suspense></PageTransition> : <Navigate to="/" replace />} />
            <Route path="/forgot-password" element={settings.sections?.authSystem !== false ? <PageTransition><Suspense fallback={<GlobalLoader />}><ForgotPassword /></Suspense></PageTransition> : <Navigate to="/" replace />} />
            <Route path="/verify-email" element={settings.sections?.authSystem !== false ? <PageTransition><Suspense fallback={<GlobalLoader />}><VerifyEmail /></Suspense></PageTransition> : <Navigate to="/" replace />} />
            <Route path="/verify-email-notice" element={settings.sections?.authSystem !== false ? <PageTransition><Suspense fallback={<GlobalLoader />}><VerifyEmailNotice /></Suspense></PageTransition> : <Navigate to="/" replace />} />
            <Route path="/auth/callback" element={settings.sections?.authSystem !== false ? <Suspense fallback={<GlobalLoader />}><SocialAuthCallback /></Suspense> : <Navigate to="/" replace />} />

            {/* Standard Pages */}
            <Route path="/orders/:id" element={<ProtectedRoute><Suspense fallback={<GlobalLoader />}><OrderDetails /></Suspense></ProtectedRoute>} />
            <Route path="/accessories" element={<PageTransition><Suspense fallback={<GlobalLoader />}><Accessories lang={lang} /></Suspense></PageTransition>} />
            <Route path="/accessories/:id" element={<PageTransition><Suspense fallback={<GlobalLoader />}><AccessoryDetails /></Suspense></PageTransition>} />
            <Route path="/compare" element={<PageTransition><Suspense fallback={<GlobalLoader />}><ComparePage /></Suspense></PageTransition>} />
            <Route path="/contact" element={<PageTransition><Suspense fallback={<GlobalLoader />}><Contact /></Suspense></PageTransition>} />
            <Route path="/checkout" element={<ProtectedRoute><ErrorBoundary><PageTransition><Suspense fallback={<GlobalLoader />}><Checkout /></Suspense></PageTransition></ErrorBoundary></ProtectedRoute>} />
            <Route path="/payment-success" element={<PageTransition><Suspense fallback={<GlobalLoader />}><PaymentSuccess /></Suspense></PageTransition>} />
            
            <Route path="/cart" element={<ErrorBoundary><PageTransition><Suspense fallback={<GlobalLoader />}><CartPage lang={lang} /></Suspense></PageTransition></ErrorBoundary>} />
            <Route path="/about" element={<Navigate to="/uber-uns" replace />} />
            
            {/* Alias redirects for common URL patterns */}
            <Route path="/sell-device" element={<ProtectedRoute><Navigate to="/valuation" replace /></ProtectedRoute>} />
            <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
            <Route path="/terms" element={<Navigate to="/agb" replace />} />
            
            {/* Legacy Dashboard Redirects */}
            <Route path="/dashboard/orders/:id" element={<LegacyOrderRedirect />} />
            <Route path="/dashboard/repairs/:id" element={<Navigate to="/dashboard?tab=repairs" replace />} />
            <Route path="/dashboard/repairs" element={<Navigate to="/dashboard?tab=repairs" replace />} />
            <Route path="/dashboard/refunds/:id" element={<Navigate to="/dashboard?tab=orders" replace />} />
            
            <Route path="/info" element={<PageTransition><Suspense fallback={<GlobalLoader />}><InfoPage /></Suspense></PageTransition>} />
            <Route path="/agb" element={<PageTransition><Suspense fallback={<GlobalLoader />}><TermsAndConditions /></Suspense></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><Suspense fallback={<GlobalLoader />}><PrivacyPolicy /></Suspense></PageTransition>} />
            <Route path="/datenschutz" element={<PageTransition><Suspense fallback={<GlobalLoader />}><InfoPage /></Suspense></PageTransition>} />
            <Route path="/service" element={<PageTransition><Suspense fallback={<GlobalLoader />}><InfoPage /></Suspense></PageTransition>} />
            <Route path="/kundenservice" element={<PageTransition><Suspense fallback={<GlobalLoader />}><InfoPage /></Suspense></PageTransition>} />
            <Route path="/impressum" element={<PageTransition><Suspense fallback={<GlobalLoader />}><InfoPage /></Suspense></PageTransition>} />
            <Route path="/uber-uns" element={<PageTransition><Suspense fallback={<GlobalLoader />}><InfoPage /></Suspense></PageTransition>} />
            <Route path="/page/:slug" element={<PageTransition><Suspense fallback={<GlobalLoader />}><InfoPage /></Suspense></PageTransition>} />
        </Route>
    );
};
