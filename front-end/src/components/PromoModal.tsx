import React, { useState, useEffect } from 'react';
import { X, Tag, Copy, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useTranslation } from 'react-i18next';

export const PromoModal = () => {
    const { settings } = useSettings();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    // Use a ref so close state persists across re-renders without triggering effects
    const hasDismissed = React.useRef(false);

    useEffect(() => {
        if (!settings?.promoPopup?.enabled) return;

        // If already dismissed in this page session, do NOT show again
        if (hasDismissed.current) return;

        // Check if dismissed within the last 24 hours
        const dismissedTimestamp = localStorage.getItem('promo_dismissed_timestamp');
        if (dismissedTimestamp) {
            const lastDismissedTime = parseInt(dismissedTimestamp, 10);
            const hoursSince = (Date.now() - lastDismissedTime) / (1000 * 60 * 60);
            if (hoursSince < 24) return; // Still within 24 hours, don't show
        }

        const timer = setTimeout(() => {
            if (!hasDismissed.current) {
                setIsOpen(true);
            }
        }, (settings.promoPopup.delay || 5) * 1000);

        return () => clearTimeout(timer);
    }, [settings?.promoPopup?.enabled, settings?.promoPopup?.couponCode]);

    const handleClose = () => {
        hasDismissed.current = true;
        setIsOpen(false);
        localStorage.setItem('promo_dismissed_timestamp', Date.now().toString());
    };

    const handleCopy = () => {
        if (settings?.promoPopup?.couponCode) {
            navigator.clipboard.writeText(settings.promoPopup.couponCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen || !settings?.promoPopup?.enabled) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
                    aria-label="Close Promo Modal"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 text-center relative z-10 space-y-6">
                    <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/20">
                        <Tag className="w-8 h-8 text-blue-400" />
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl sm:text-3xl font-black text-white px-4">
                            {settings.promoPopup.title || t('promo.title', 'Sonderangebot!')}
                        </h2>
                        <p className="text-slate-300 leading-relaxed max-w-[280px] mx-auto text-sm sm:text-base">
                            {settings.promoPopup.message}
                        </p>
                    </div>

                    {settings.promoPopup.couponCode && (
                        <div className="pt-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                {t('promo.yourCode', 'DEIN EXKLUSIVER CODE')}
                            </p>
                            <div
                                onClick={handleCopy}
                                className="group relative bg-black/40 border border-slate-700 hover:border-blue-500 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all overflow-hidden"
                            >
                                <span className="font-mono font-bold text-lg text-white tracking-widest pl-2">
                                    {settings.promoPopup.couponCode}
                                </span>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${copied
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50'
                                    }`}>
                                    {copied ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            {t('promo.copied', 'Kopiert!')}
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            {t('promo.copy', 'Kopieren')}
                                        </>
                                    )}
                                </div>
                            </div>
                            {settings.promoPopup.couponDetails && (
                                <div className="mt-4 flex flex-col gap-2 text-sm text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                    <div className="flex items-center justify-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-400" />
                                        <span>{t('promo.validUntil', 'Gültig bis')}: <span className="text-white font-medium">{new Date(settings.promoPopup.couponDetails.validUntil).toLocaleDateString()}</span></span>
                                    </div>
                                    {settings.promoPopup.couponDetails.usageLimit && (
                                        <div className="flex items-center justify-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-emerald-400" />
                                            <span>{t('promo.couponsLeft', 'Gutscheine übrig')}: <span className="text-white font-medium">{Math.max(0, settings.promoPopup.couponDetails.usageLimit - settings.promoPopup.couponDetails.usedCount)}</span></span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleClose}
                        className="text-xs font-medium text-slate-500 hover:text-slate-300 underline-offset-4 hover:underline transition-colors mt-4 block mx-auto"
                    >
                        {t('promo.noThanks', 'Nein danke, weiter zur Seite')}
                    </button>
                </div>
            </div>
        </div>
    );
};
