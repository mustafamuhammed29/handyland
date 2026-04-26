import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ShoppingCart, X, Trash2, ArrowRight, Zap, Heart, Tag, Truck, Check, Loader2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { generateWhatsAppLink } from '../utils/whatsappHelper';
import { LanguageCode } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

import { api } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
import { getImageUrl } from '../utils/imageUrl';
import { useTranslation } from 'react-i18next';

import { cleanProductName } from '../utils/cleanProductName';

interface CartDrawerProps {}

export const CartDrawer: React.FC<CartDrawerProps> = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // BUG-03 fix: Prevent rendering on cart/checkout pages to avoid visual conflicts
    const isCartPage = location.pathname === '/cart' || location.pathname === '/checkout';
    if (isCartPage) return null;

    const {
        cart, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen,
        cartTotal, finalTotal,
        coupon, applyCoupon, removeCoupon,
        freeShippingThreshold
    } = useCart();
    
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { settings } = useSettings();

    const { t } = useTranslation();
    const [couponCodeIn, setCouponCodeIn] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);

    const threshold = freeShippingThreshold;
    const progress = Math.min((cartTotal / threshold) * 100, 100);
    const remainingForFreeShipping = Math.max(0, threshold - cartTotal);

    const handleCheckout = () => {
        setIsCartOpen(false);
        const whatsappMode = settings?.features?.whatsappOrders;
        if (whatsappMode?.enabled && whatsappMode?.phoneNumber) {
            const url = generateWhatsAppLink({
                phoneNumber: whatsappMode.phoneNumber,
                messageTemplate: whatsappMode.message,
                items: cart.map(i => ({ name: i.title, quantity: i.quantity || 1, price: i.price })),
                totalAmount: finalTotal
            });
            window.open(url, '_blank');
        } else {
            navigate('/checkout');
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCodeIn) return;
        setCouponLoading(true);
        setCouponError(null);
        try {
            // api interceptor returns response.data directly, so type it accordingly
            interface CouponValidateResponse {
                success: boolean;
                couponCode: string;
                discount: number;
                message?: string;
            }
            const data = await api.post('/api/coupons/validate', {
                code: couponCodeIn,
                cartTotal: cartTotal
            }) as unknown as CouponValidateResponse;

            if (data.success) {
                applyCoupon(data.couponCode, data.discount);
                setCouponCodeIn('');
            } else {
                setCouponError(data.message || 'Invalid coupon');
            }
        } catch (err: any) {
            setCouponError(err.response?.data?.message || 'Failed to apply coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleToggleWishlist = (item: any) => {
        if (isInWishlist(item.id)) {
            removeFromWishlist(item.id);
        } else {
            addToWishlist(item);
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isCartOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
                    onClick={() => setIsCartOpen(false)}
                />
            )}

            {/* Drawer */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200 dark:border-slate-700 transform transition-transform duration-500 z-[120] flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div
                    className="p-6 border-b border-black/5 dark:border-slate-800 bg-slate-50/80 dark:bg-black/40"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-brand-primary" /> {t('cart', 'Warenkorb')}
                            <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full">{cart.length}</span>
                        </h3>
                        <button onClick={() => setIsCartOpen(false)} aria-label={t('cart.close', 'Warenkorb schließen')} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Free Shipping Progress */}
                    <div className="bg-white dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            <Truck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            {remainingForFreeShipping > 0
                                ? <span>{t('cart.addForFreeShipping', 'Noch {{amount}} für kostenlosen Versand', { amount: formatPrice(remainingForFreeShipping) })}</span>
                                : <span className="text-emerald-500 dark:text-emerald-400">{t('cart.freeShippingUnlocked', 'Du hast kostenlosen Versand freigeschaltet!')}</span>
                            }
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-brand-secondary to-brand-primary transition-all duration-1000 w-[var(--progress-w)]"
                                style={{ '--progress-w': `${progress}%` } as React.CSSProperties}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-32 h-32 mb-6 relative">
                                <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-2xl"></div>
                                <div className="relative w-full h-full bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-inner">
                                    <ShoppingCart className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 rounded-full p-2 shadow-lg border border-slate-100 dark:border-slate-800">
                                    <span className="flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-secondary"></span>
                                    </span>
                                </div>
                            </div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{t('cart.emptyTitle', 'Dein Warenkorb ist leer')}</h4>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-[240px] leading-relaxed">
                                {t('cart.emptyText', 'Sieht so aus, als hättest du noch nichts in deinen Warenkorb gelegt. Entdecke unsere Top-Produkte!')}
                            </p>
                            <button
                                onClick={() => { setIsCartOpen(false); navigate('/marketplace'); }}
                                className="group relative px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold transition-all hover:scale-105 hover:shadow-xl hover:shadow-slate-900/20 dark:hover:shadow-white/20 active:scale-95 overflow-hidden"
                            >
                                <span className="relative z-10">{t('cart.shopNow', 'Jetzt einkaufen')}</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </button>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {cart.map((item, idx) => (
                                <motion.div 
                                    key={`${item.id}-${idx}`}
                                    layout
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="relative mb-4 touch-pan-y"
                                >
                                    {/* Swipe to Delete Background */}
                                    <div className="absolute inset-0 bg-red-500/90 rounded-xl flex items-center justify-end px-6 z-0" onClick={() => removeFromCart(item.id)}>
                                        <Trash2 className="w-6 h-6 text-white" />
                                    </div>
                                    
                                    {/* The interactive card */}
                                    <motion.div 
                                        drag="x"
                                        dragConstraints={{ left: -80, right: 0 }}
                                        onDragEnd={(e, { offset }) => {
                                            if (offset.x < -50) {
                                                removeFromCart(item.id);
                                            }
                                        }}
                                        className="relative z-10 flex gap-4 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-sm dark:shadow-none"
                                        whileDrag={{ scale: 1.02, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}
                                    >
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 pointer-events-none">
                                            <img
                                                src={getImageUrl(item.image)}
                                                className="w-full h-full object-cover"
                                                alt=""
                                                onError={(e: any) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = '/placeholder-device.svg'; }}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate pr-2">{cleanProductName(item.title, item.subtitle)}</h4>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleToggleWishlist(item)}
                                                            className={`${isInWishlist(item.id) ? 'text-pink-500' : 'text-slate-500 hover:text-pink-400'} transition-colors`}
                                                            title={isInWishlist(item.id) ? t('cart.removeFromFavorites', 'Aus Favoriten entfernen') : t('cart.addToFavorites', 'Zu Favoriten hinzufügen')}
                                                            aria-label={t('cart.toggleFavorite', 'Favorit umschalten for {{name}}', { name: item.title })}
                                                        >
                                                            <Heart className={`w-4 h-4 ${isInWishlist(item.id) ? 'fill-current' : ''}`} />
                                                        </button>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-slate-500 hover:text-red-400 transition-colors md:hidden"
                                                            title={t('cart.swipeRemove', 'Zum Entfernen wischen')}
                                                            aria-label={t('cart.removeItem', '{{name}} aus dem Warenkorb entfernen', { name: item.title })}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-slate-500 hover:text-red-400 transition-colors hidden md:block"
                                                            title={t('cart.remove', 'Entfernen')}
                                                            aria-label={t('cart.removeItem', '{{name}} aus dem Warenkorb entfernen', { name: item.title })}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-slate-400 truncate mt-0.5">{item.subtitle || item.category}</div>
                                            </div>

                                            <div className="flex items-end justify-between mt-2">
                                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 rounded-lg p-1 border border-slate-200 dark:border-slate-800">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
                                                        disabled={(item.quantity || 1) <= 1}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-white w-4 text-center">{item.quantity || 1}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        disabled={(item.quantity || 1) >= (item.stock ?? Infinity)}
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <div className="text-right">
                                                    {/* FIXED: Use formatPrice for consistent currency display */}
                                                    <div className="text-brand-primary font-bold">{formatPrice(item.price)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-black/40 space-y-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">

                    {/* Coupon Input */}
                    {cart.length > 0 && (
                        <div>
                            {coupon ? (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between animate-in fade-in">
                                    <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400">
                                        <Tag className="w-4 h-4" />
                                        <span className="font-bold text-sm">Code: {coupon.code}</span>
                                    </div>
                                    <button onClick={removeCoupon} aria-label="Remove coupon" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative flex gap-2">
                                    <div className="relative flex-1">
                                        <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                        <input
                                            type="text"
                                            placeholder={t('cart.promoCode', 'Promo Code')}
                                            value={couponCodeIn}
                                            onChange={(e) => setCouponCodeIn(e.target.value)}
                                            className="w-full bg-white dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-slate-900 dark:text-white text-sm focus:border-brand-primary outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                        />
                                    </div>
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={!couponCodeIn || couponLoading}
                                        className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors border border-slate-800 dark:border-slate-700"
                                    >
                                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('cart.apply', 'Anwenden')}
                                    </button>
                                </div>
                            )}
                            {couponError && <p className="text-red-400 text-xs mt-2 animate-in slide-in-from-top-1 ml-1">{couponError}</p>}
                        </div>
                    )}

                    {/* Totals */}
                    <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>{t('cart.subtotal', 'Zwischensumme')}</span>
                            <span>{formatPrice(cartTotal)}</span>
                        </div>
                        {coupon && (
                            <div className="flex justify-between text-emerald-500 dark:text-emerald-400 text-sm">
                                <span>{t('cart.discount', 'Rabatt')}</span>
                                <span>-{formatPrice(coupon.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                            <span className="text-lg font-bold text-slate-900 dark:text-white">{t('cart.total', 'Gesamt')}</span>
                            <span className="text-2xl font-bold text-brand-primary">{formatPrice(finalTotal)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary hover:to-brand-secondary text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {settings?.features?.whatsappOrders?.enabled ? t('cart.reserveWhatsapp', 'احجز عبر الواتساب') : t('cart.checkoutSecurely', 'Sicher zur Kasse')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </>
    );
};
