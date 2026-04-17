import React, { useState, useEffect } from 'react';
import { X, Tag, Copy, CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

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
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [coupon, setCoupon] = useState<PromoCoupon | null>(null);
    const hasDismissed = React.useRef(false);

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
                const res = await fetch('/api/coupons/latest-promo');
                const data: PromoCoupon = await res.json();
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

    const title = discountLabel + ' Rabatt sichern!';
    const message = 'Nutze den Code unten beim Checkout und spare ' + discountLabel + ' auf deine Bestellung!';

    const couponsLeft = coupon.usageLimit ? Math.max(0, coupon.usageLimit - coupon.usedCount) : null;

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
                        <div className="flex items-center justify-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                                Exklusives Angebot
                            </span>
                            <Sparkles className="w-5 h-5 text-amber-400" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white px-4">
                            {title}
                        </h2>
                        <p className="text-slate-300 leading-relaxed max-w-[280px] mx-auto text-sm sm:text-base">
                            {message}
                        </p>
                    </div>

                    <div className="pt-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            DEIN EXKLUSIVER CODE
                        </p>
                        <div
                            onClick={handleCopy}
                            className="group relative bg-black/40 border border-slate-700 hover:border-blue-500 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all overflow-hidden"
                        >
                            <span className="font-mono font-bold text-lg text-white tracking-widest pl-2">
                                {coupon.code}
                            </span>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${copied
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50'
                                }`}>
                                {copied ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Kopiert!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Kopieren
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Coupon details */}
                        <div className="mt-4 flex flex-col gap-2 text-sm text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-center gap-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span>Gültig bis: <span className="text-white font-medium">{new Date(coupon.validUntil).toLocaleDateString('de-DE')}</span></span>
                            </div>
                            {couponsLeft !== null && (
                                <div className="flex items-center justify-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-emerald-400" />
                                    <span>Gutscheine übrig: <span className="text-white font-medium">{couponsLeft}</span></span>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        className="text-xs font-medium text-slate-500 hover:text-slate-300 underline-offset-4 hover:underline transition-colors mt-4 block mx-auto"
                    >
                        Nein danke, weiter zur Seite
                    </button>
                </div>
            </div>
        </div>
    );
};
