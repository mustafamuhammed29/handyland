import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const AdminRedirect = () => {
    const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';
    const location = useLocation();

    useEffect(() => {
        const subPath = location.pathname.startsWith('/admin') ? location.pathname.substring(6) : location.pathname;
        window.location.href = `${adminUrl}${subPath}${location.search}${location.hash}`;
    }, [adminUrl, location]);

    return (
        <div className="min-h-[100dvh] bg-slate-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm animate-pulse">Redirecting to Admin Portal...</p>
            </div>
        </div>
    );
};
