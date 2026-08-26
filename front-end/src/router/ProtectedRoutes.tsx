import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { GlobalLoader } from '../components/GlobalLoader';
import { ProtectedRoute } from '../components/ProtectedRoute';

import { LanguageCode, User } from '../types';

const Dashboard = React.lazy(() => import('../components/Dashboard').then(module => ({ default: module.Dashboard })));
const MyValuations = React.lazy(() => import('../pages/MyValuations').then(m => ({ default: m.MyValuations })));
const SellerStudio = React.lazy(() => import('../components/SellerStudio').then(m => ({ default: m.SellerStudio })));

interface ProtectedRoutesProps {
    user: User | null;
    logout: () => void;
    lang: LanguageCode;
}

export const getProtectedRoutes = ({ user, logout, lang }: ProtectedRoutesProps) => {
    return (
        <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<PageTransition><Suspense fallback={<GlobalLoader />}><Dashboard user={user} logout={logout} /></Suspense></PageTransition>} />
            <Route path="/dashboard/valuations" element={<PageTransition><Suspense fallback={<GlobalLoader />}><MyValuations /></Suspense></PageTransition>} />
            <Route path="/seller" element={<PageTransition><Suspense fallback={<GlobalLoader />}><SellerStudio lang={lang} /></Suspense></PageTransition>} />
        </Route>
    );
};
