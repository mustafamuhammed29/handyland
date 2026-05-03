import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, ArrowRight, Minus, Plus, Trash2, ArrowLeft, Sparkles } from 'lucide-react';
import { LanguageCode } from '../types';
import { api } from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import { FREE_SHIPPING_THRESHOLD } from '../utils/constants';

interface CartProps {
    lang: LanguageCode;
}

export const Cart: React.FC<CartProps> = ({ lang }) => {
    const { cart, updateQuantity, removeFromCart, cartTotal, finalTotal, freeShippingThreshold, addToCart } = useCart();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [upsellItems, setUpsellItems] = useState<any[]>([]);
    const [features, setFeatures] = useState<any>(null);

    useEffect(() => {
        let ignore = false;
        const fetchData = async () => {
            try {
                const [upsellRes, settingsRes] = await Promise.all([
                    api.get('/api/accessories'),
                    api.get('/api/settings')
                ]);
                
                if (upsellRes && !ignore) {
                    const data = (upsellRes as any).data || upsellRes;
                    if (Array.isArray(data)) {
                        setUpsellItems(data.slice(0, 3)); // show top 3
                    }
                }

                if (!ignore) {
                    const sData = (settingsRes as any)?.data || settingsRes;
                    setFeatures(sData?.features);
                }
            } catch (err) {
                console.error('Failed to fetch cart data:', err);
            }
        };
        fetchData();
        return () => { ignore = true; };
    }, []);

    const isRtl = lang === 'ar';
    const threshold = freeShippingThreshold; 
    const isFreeShipping = finalTotal >= threshold;

    if (cart.length === 0) {
        return (
            <div className="min-h-[100dvh] bg-slate-950 pt-32 pb-20 flex flex-col items-center justify-center text-center px-4">
                <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800">
                    <ShoppingCart className="w-12 h-12 text-slate-500" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{t('cart.emptyTitle', 'Your Cart is Empty')}</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
                    {t('cart.emptyText', 'Looks like you haven\'t added anything to your cart yet. Discover our premium refurbished devices and accessories.')}
                </p>
                <button
                    onClick={() => navigate('/marketplace')}
                    className="flex items-center gap-2 bg-brand-primary text-black px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-primary/25 hover:scale-[1.02]"
                >
                    <ShoppingCart className="w-5 h-5" />
                    {t('cart.continueShopping', 'Continue Shopping')}
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-slate-950 pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-blue-500" />
                        {t('cart.title', 'Shopping Cart')}
                        <span className="text-xl font-medium text-slate-500">({cart.length} {cart.length === 1 ? t('cart.item', 'item') : t('cart.items', 'items')})</span>
                    </h1>
                    <button
                        onClick={() => navigate('/marketplace')}
                        className="hidden md:flex items-center gap-2 text-brand-primary hover:text-brand-primary/80 font-medium transition-colors"
                    >
                        <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                        {t('cart.continueShopping', 'Continue Shopping')}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    
                    {/* Cart Items */}
                    <div className="lg:col-span-8 space-y-6">
                        {cart.map((item) => (
                            <div key={item.id} className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/60 p-4 sm:p-6 flex flex-col sm:flex-row gap-6 shadow-xl transition-all hover:bg-slate-900/80 hover:border-slate-700">
                                {/* Image */}
                                <div className="w-full sm:w-32 h-32 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 p-2">
                                    <img
                                        src={getImageUrl(item.image)}
                                        alt={item.title || (item as any).name}
                                        className="w-full h-full object-contain"
                                        onError={(e: any) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = '/placeholder-device.svg'; }}
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col justify-between items-start w-full">
                                    <div className="w-full flex justify-between items-start gap-4 mb-4">
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                                                {item.title || (item as any).name}
                                            </h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                                {(item.category as any)?.name || (typeof item.category === 'string' && item.category !== 'device' ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'Smartphone')}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-xl font-bold text-slate-900 dark:text-white">€{item.price.toFixed(2)}</div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="w-full flex justify-between items-center mt-auto">
                                        {/* Quantity Controls */}
                                        <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-700">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-800 rounded-md transition-colors"
                                                title="Decrease quantity"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-10 text-center text-slate-900 dark:text-white font-bold">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                disabled={(item.quantity || 1) >= (item.stock || Infinity)}
                                                className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-800 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                title="Increase quantity"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition-colors flex items-center gap-2"
                                            title={t('cart.removeItem', 'Remove Item')}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                            <span className="text-sm font-medium hidden sm:inline">{t('cart.remove', 'Remove')}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                    {/* Smart Cart Upselling */}
                    {features?.cartUpselling !== false && upsellItems.length > 0 && (
                        <div className="mt-12 bg-slate-900/40 border border-brand-primary/20 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-brand-primary/10 transition-colors"></div>
                            <div className="flex items-center gap-2 mb-6 text-brand-primary">
                                <Sparkles className="w-6 h-6 animate-pulse" />
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('cart.frequentlyBought', 'Complete Your Setup')}</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                                {upsellItems.map((item) => (
                                    <div key={item._id || item.id} className="bg-slate-950/80 backdrop-blur-sm rounded-xl p-4 border border-slate-800 hover:border-brand-primary/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all flex flex-col group/item relative overflow-hidden">
                                        <div className="h-28 bg-white/5 rounded-lg p-2 mb-4 flex items-center justify-center relative">
                                            <img src={getImageUrl(item.image)} alt={item.name} className="max-h-full object-contain drop-shadow-lg group-hover/item:scale-110 transition-transform duration-500" onError={(e: any) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = '/placeholder-device.svg'; }} />
                                        </div>
                                        <h4 className="text-slate-900 dark:text-white font-bold text-sm mb-1 line-clamp-2 leading-tight flex-1" title={item.name}>{item.name}</h4>
                                        <div className="flex justify-between items-center mt-3">
                                            <div className="text-brand-primary font-bold text-base">€{item.price.toFixed(2)}</div>
                                            <button 
                                                onClick={() => {
                                                    addToCart({
                                                        id: item._id || item.id,
                                                        title: item.name,
                                                        subtitle: item.tag || 'Accessory',
                                                        price: item.price,
                                                        image: item.image,
                                                        category: 'accessory'
                                                    });
                                                }}
                                                className="px-3 py-1.5 bg-slate-800 hover:bg-brand-primary hover:text-black text-slate-900 dark:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 active:scale-95"
                                            >
                                                <Plus className="w-3 h-3" /> {t('common.add', 'Add')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-4 lg:sticky lg:top-28 self-start mt-8 lg:mt-0">
                        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 shadow-2xl rounded-2xl p-6 sm:p-8">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-800 pb-4">
                                {t('cart.summary', 'Order Summary')}
                            </h2>

                            <div className="space-y-4 mb-6 text-slate-700 dark:text-slate-300">
                                <div className="flex justify-between items-center">
                                    <span>{t('cart.subtotal', 'Subtotal')}</span>
                                    <span className="text-slate-900 dark:text-white font-medium">€{cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>{t('cart.shipping', 'Shipping')}</span>
                                    {isFreeShipping ? (
                                        <span className="text-emerald-400 font-medium tracking-wide text-sm bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">{t('cart.free', 'FREE')}</span>
                                    ) : (
                                        <span className="text-slate-500 dark:text-slate-400">{t('cart.calculatedAtCheckout', 'Calculated at checkout')}</span>
                                    )}
                                </div>
                                {/* Free Shipping Progress */}
                                {freeShippingThreshold > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-800">
                                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                                            {Math.max(0, threshold - cartTotal) > 0 ? (
                                                <span>{t('cart.addForFreeShipping', 'Add €{{amount}} for Free Shipping', { amount: Math.max(0, threshold - cartTotal).toFixed(2) })}</span>
                                            ) : (
                                                <span className="text-emerald-400 font-bold">{t('cart.freeShippingUnlocked', "You've unlocked Free Shipping!")}</span>
                                            )}
                                            <span>{Math.min(100, Math.round((cartTotal / threshold) * 100))}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                            <div 
                                                className="bg-blue-500 h-1.5 transition-all duration-500 ease-out rounded-full"
                                                style={{ width: `${Math.min((cartTotal / threshold) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-700 pt-6 mb-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">{t('cart.total', 'Total')}</span>
                                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                                        €{finalTotal.toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 text-right">{t('cart.taxesIncluded', 'Taxes included if applicable')}</p>
                            </div>

                            <button
                                onClick={() => {
                                    navigate('/checkout');
                                }}
                                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-brand-secondary to-brand-primary text-white py-4 rounded-xl font-bold text-lg hover:from-brand-secondary/90 hover:to-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transform hover:-translate-y-0.5"
                            >
                                {t('cart.checkout', 'Proceed to Checkout')}
                                <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                            </button>
                            
                            <div className="mt-4 text-center">
                                <button
                                    onClick={() => navigate('/marketplace')}
                                    className="md:hidden text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    {t('cart.continueShopping', 'Continue Shopping')}
                                </button>
                            </div>

                            {/* Trust Badges */}
                            <div className="mt-8 pt-6 border-t border-slate-800/80">
                                <div className="flex justify-center flex-wrap gap-4 opacity-70 grayscale">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
