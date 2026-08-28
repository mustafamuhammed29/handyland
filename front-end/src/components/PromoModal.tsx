import React, { useState, useEffect, useRef } from 'react';
import { X, Tag, Copy, CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import api from '../utils/api';

interface PromoCoupon {
    found: boolean;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    validUntil: string;
    usageLimit: number | null;
    usedCount: number;
}

export const PromoModal = () => {
    const { settings } = useSettings();
    const { t, i18n } = useTranslation();
    const language = (i18n.language || 'de').split('-')[0];
    const isRtl = language === 'ar' || language === 'fa';

    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [coupon, setCoupon] = useState<PromoCoupon | null>(null);
    const hasDismissed = React.useRef(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        // Master toggle from admin settings
        if (!settings?.promoPopup?.enabled) return;

        // If already dismissed in this page session, do NOT fetch
        if (hasDismissed.current) return;

        // Check if dismissed within the last 24 hours
        const dismissedTimestamp = localStorage.getItem('promo_dismissed_timestamp');
        if (dismissedTimestamp) {
            const lastDismissedTime = parseInt(dismissedTimestamp, 10);
            const hoursSince = (Date.now() - lastDismissedTime) / (1000 * 60 * 60);
            if (hoursSince < 24) return;
        }

        // Fetch latest active coupon from backend
        const fetchPromo = async () => {
            try {
                const data: PromoCoupon = await api.get('/api/coupons/latest-promo');
                if (data.found && data.code) {
                    setCoupon(data);
                    // Use delay from settings (default 5 seconds)
                    const delay = (settings.promoPopup?.delay ?? 5) * 1000;
                    setTimeout(() => {
                        if (!hasDismissed.current) {
                            setIsOpen(true);
                        }
                    }, delay);
                }
            } catch {
                // Silently fail — no promo to show
            }
        };

        fetchPromo();
    }, [settings?.promoPopup?.enabled]);

    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement as HTMLElement;
            // Delay slightly to allow the modal to mount and render fully
            const focusTimer = setTimeout(() => {
                if (modalRef.current) {
                    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    if (focusable.length > 0) {
                        focusable[0].focus();
                    }
                }
            }, 50);

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    handleClose();
                    return;
                }

                if (e.key === 'Tab' && modalRef.current) {
                    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    if (focusable.length === 0) return;

                    const firstElement = focusable[0];
                    const lastElement = focusable[focusable.length - 1];

                    if (e.shiftKey) {
                        // Shift + Tab
                        if (document.activeElement === firstElement) {
                            lastElement.focus();
                            e.preventDefault();
                        }
                    } else {
                        // Tab
                        if (document.activeElement === lastElement) {
                            firstElement.focus();
                            e.preventDefault();
                        }
                    }
                }
            };

            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                clearTimeout(focusTimer);
                if (previousFocusRef.current) {
                    previousFocusRef.current.focus();
                }
            };
        }
    }, [isOpen]);

    const handleClose = () => {
        hasDismissed.current = true;
        setIsOpen(false);
        localStorage.setItem('promo_dismissed_timestamp', Date.now().toString());
    };

    const handleCopy = () => {
        if (coupon?.code) {
            navigator.clipboard.writeText(coupon.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen || !coupon) return null;

    // Build dynamic title and message based on coupon data
    const discountLabel = coupon.discountType === 'percentage'
        ? `${coupon.discountValue}%`
        : `${coupon.discountValue}€`;

    const title = t('promo.title', { discount: discountLabel, defaultValue: `${discountLabel} Rabatt sichern!` });
    const message = t('promo.message', { discount: discountLabel, defaultValue: `Nutze den Code unten beim Checkout und spare ${discountLabel} auf deine Bestellung!` });

    const couponsLeft = coupon.usageLimit ? Math.max(0, coupon.usageLimit - coupon.usedCount) : null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div
                ref={modalRef}
                dir={isRtl ? 'rtl' : 'ltr'}
                className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 focus:outline-none"
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="promo-title"
                aria-describedby="promo-description"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-20 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    aria-label={t('promo.closeAria', 'Aktionsfenster schließen')}
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 text-center relative z-10 space-y-6">
                    <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/20">
                        <Tag className="w-8 h-8 text-blue-400" />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                                {t('promo.exclusiveOffer', 'Exklusives Angebot')}
                            </span>
                            <Sparkles className="w-5 h-5 text-amber-400" />
                        </div>
                        <h2 id="promo-title" className="text-2xl sm:text-3xl font-black text-white px-4">
                            {title}
                        </h2>
                        <p id="promo-description" className="text-slate-300 leading-relaxed max-w-[280px] mx-auto text-sm sm:text-base">
                            {message}
                        </p>
                    </div>

                    <div className="pt-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            {t('promo.yourCode', 'DEIN EXKLUSIVER CODE')}
                        </p>
                        <div
                            onClick={handleCopy}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleCopy();
                                }
                            }}
                            role="button"
                            tabIndex={0}
                            className="group relative bg-black/40 border border-slate-700 hover:border-blue-500 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={t('promo.copyCodeAria', { code: coupon.code, defaultValue: `Gutscheincode kopieren: ${coupon.code}` })}
                        >
                            <span className="font-mono font-bold text-lg text-white tracking-widest pl-2 rtl:pl-0 rtl:pr-2">
                                {coupon.code}
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

                        {/* Coupon details */}
                        <div className="mt-4 flex flex-col gap-2 text-sm text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-center gap-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span>{t('promo.validUntil', 'Gültig bis:')} <span className="text-white font-medium">{new Date(coupon.validUntil).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : language === 'tr' ? 'tr-TR' : language === 'ru' ? 'ru-RU' : language === 'ar' ? 'ar-SA' : 'fa-IR')}</span></span>
                            </div>
                            {couponsLeft !== null && (
                                <div className="flex items-center justify-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-emerald-400" />
                                    <span>{t('promo.couponsLeft', 'Gutscheine übrig:')} <span className="text-white font-medium">{couponsLeft}</span></span>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        className="text-xs font-medium text-slate-500 hover:text-slate-300 underline-offset-4 hover:underline transition-colors mt-4 block mx-auto focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 cursor-pointer"
                    >
                        {t('promo.decline', 'Nein danke, weiter zur Seite')}
                    </button>
                </div>
            </div>
        </div>
    );
};

