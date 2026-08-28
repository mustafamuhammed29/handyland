import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Shows a banner when the user goes offline. Auto-hides when connection is restored.
 */
export const OfflineBanner: React.FC = () => {
    const { t, i18n } = useTranslation();
    const language = (i18n.language || 'de').split('-')[0];
    const isRtl = language === 'ar' || language === 'fa';

    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="flex items-center gap-3 px-5 py-3 bg-red-950 border border-red-500/50 rounded-2xl shadow-2xl text-white">
                <WifiOff className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                    <p className="font-bold text-sm">{t('offline.title', 'Keine Internetverbindung')}</p>
                    <p className="text-xs text-red-300">{t('offline.description', 'Einige Funktionen stehen möglicherweise nicht zur Verfügung, bis die Verbindung wiederhergestellt ist.')}</p>
                </div>
            </div>
        </div>
    );
};
