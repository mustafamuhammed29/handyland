import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requireAdmin = true
}) => {
    // We use local state to ensure we verified with backend, 
    // instead of just trusting localStorage which might be stale.
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();

    useEffect(() => {
        const verifySession = async () => {
            if (!isAuthenticated) {
                setIsVerified(false);
                return;
            }

            try {
                // Verify with backend
                // This ensures the token is valid and not expired
                await api.get('/auth/me'); // Assuming /auth/me exists and checks token
                setIsVerified(true);
            } catch (error) {
                console.error('Session verification failed:', error);
                logout();
                setIsVerified(false);
            }
        };

        verifySession();
    }, [isAuthenticated, logout]);

    // Show loading while verifying (prevent flash of content or login)
    if (isVerified === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!isVerified) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (requireAdmin && user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
                <div className="bg-slate-900 p-8 rounded-lg shadow-md max-w-md border border-slate-800 text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h2>
                    <p className="text-slate-300 mb-4">
                        You don't have admin privileges to access this page.
                    </p>
                    <p className="text-sm text-slate-500 mb-6">
                        Current role: <strong className="text-slate-300">{user?.role}</strong>
                    </p>
                    <button
                        onClick={logout}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
