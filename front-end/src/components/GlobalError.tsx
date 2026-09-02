import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, ServerCrash, ShieldAlert } from 'lucide-react';
import { useTranslation } from "react-i18next";

interface GlobalErrorProps {
    onRetry?: () => void;
    errorType?: 'connection' | 'maintenance' | 'unknown';
}

export const GlobalError: React.FC<GlobalErrorProps> = ({ onRetry, errorType = 'connection' }) => {
    const { t } = useTranslation();
    const [countdown, setCountdown] = useState(8);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (onRetry) onRetry();
                    else window.location.reload();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [onRetry]);

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center">

                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                    <WifiOff className="w-8 h-8 text-amber-400" />
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="48" fill={t('none')} stroke="currentColor" strokeWidth="4" className="text-slate-800" />
                        <circle cx="50" cy="50" r="48" fill={t('none')} stroke="currentColor" strokeWidth="4" className="text-amber-500 transition-all duration-1000 ease-linear" strokeDasharray="301" strokeDashoffset={301 - (301 * (countdown / 8))} />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-white mb-2">
                    Verbindung wird hergestellt...
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                    Unser Server startet gerade. Bitte warten Sie einen Moment. Neuversuch in {countdown}s.
                </p>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 mb-6 overflow-hidden">
                    <div 
                        className="bg-cyan-500 h-1.5 rounded-full transition-all duration-1000 ease-linear" 
                        style={{ width: `${((8 - countdown) / 8) * 100}%` }} 
                    />
                </div>

                <button
                    onClick={() => {
                        if (onRetry) onRetry();
                        else window.location.reload();
                    }}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Erneut versuchen / Retry
                </button>

                <p className="text-slate-600 text-xs mt-4">
                    Falls das Problem anhält, kontaktieren Sie uns via WhatsApp
                </p>
            </div>
        </div>
    );
};
