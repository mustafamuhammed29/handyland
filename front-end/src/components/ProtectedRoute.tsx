
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlobalLoader } from './GlobalLoader';

interface ProtectedRouteProps {
    children?: React.ReactNode;
    allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth(); // removed isAuthenticated, checking user directly is fine or use isAuthenticated
    const location = useLocation();

    if (loading) {
        return <GlobalLoader />;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
