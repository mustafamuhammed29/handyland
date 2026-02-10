import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingCart, X, Trash2, ArrowRight, Zap, Heart, Tag, Truck, Check, Loader2 } from 'lucide-react';
import { LanguageCode, ViewState } from '../types';
import { translations } from '../i18n';
import { api } from '../utils/api';

interface CartDrawerProps {
    lang: LanguageCode;
    setView: (view: ViewState) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ lang, setView }) => {
    const {
        cart, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen,
        cartTotal, finalTotal,
        coupon, applyCoupon, removeCoupon,
        addToWishlist, isInWishlist
    } = useCart();

    const t = translations[lang];
    const [couponCodeIn, setCouponCodeIn] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);

    // Free Shipping Threshold
    const FREE_SHIPPING_THRESHOLD = 100;
    const progress = Math.min((cartTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
    const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);

    const handleCheckout = () => {
        setIsCartOpen(false);
        setView(ViewState.CHECKOUT);
    };

    const handleApplyCoupon = async () => {
        if (!couponCodeIn) return;
        setCouponLoading(true);
        setCouponError(null);
        try {
            const response = await api.post<any>('/api/orders/apply-coupon', {
                code: couponCodeIn,
                cartTotal: cartTotal
            });

            if (response.success) {
                applyCoupon(response.couponCode, response.discount);
                setCouponCodeIn('');
            } else {
                setCouponError(response.message || 'Invalid coupon');
            }
        } catch (err: any) {
            setCouponError(err.response?.data?.message || 'Failed to apply coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleMoveToWishlist = (item: any) => {
        addToWishlist(item);
        removeFromCart(item.id);
    };

    return (
        <>
            {/* Backdrop */}
            {isCartOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    onClick={() => setIsCartOpen(false)}
                />
            )}

            {/* Drawer */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 transform transition-transform duration-500 z-[70] flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="p-6 border-b border-slate-800 bg-black/40">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-cyan-400" /> Global Loadout
                            <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">{cart.length}</span>
                        </h3>
                        <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Free Shipping Progress */}
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
                            <Truck className="w-4 h-4 text-emerald-400" />
                            {remainingForFreeShipping > 0
                                ? <span>Add <span className="text-emerald-400">{remainingForFreeShipping.toFixed(2)}{t.currency}</span> for Free Shipping</span>
                                : <span className="text-emerald-400">You've unlocked Free Shipping!</span>
                            }
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                            <ShoppingCart className="w-16 h-16 mb-4" />
                            <p>Your cart is empty</p>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="flex gap-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800 group hover:border-slate-600 transition-all animate-in slide-in-from-right-4 fade-in duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                <div className="w-20 h-20 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                                    <img src={item.image} className="w-full h-full object-cover" alt="" />
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-white text-sm truncate pr-2">{item.title}</h4>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleMoveToWishlist(item)}
                                                    className="text-slate-500 hover:text-pink-400 transition-colors"
                                                    title="Move to Wishlist"
                                                >
                                                    <Heart className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-slate-500 hover:text-red-400 transition-colors"
                                                    title="Remove"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-400 truncate mt-0.5">{item.subtitle || item.category}</div>
                                    </div>

                                    <div className="flex items-end justify-between mt-2">
                                        <div className="flex items-center gap-3 bg-slate-950 rounded-lg p-1 border border-slate-800">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
                                                disabled={(item.quantity || 1) <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="text-sm font-mono font-bold text-white w-4 text-center">{item.quantity || 1}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-cyan-400 font-bold">{item.price}{t.currency}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-black/40 space-y-4">

                    {/* Coupon Input */}
                    {cart.length > 0 && (
                        <div>
                            {coupon ? (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between animate-in fade-in">
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <Tag className="w-4 h-4" />
                                        <span className="font-bold text-sm">Code: {coupon.code}</span>
                                    </div>
                                    <button onClick={removeCoupon} className="text-slate-400 hover:text-white p-1 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative flex gap-2">
                                    <div className="relative flex-1">
                                        <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            placeholder="Promo Code"
                                            value={couponCodeIn}
                                            onChange={(e) => setCouponCodeIn(e.target.value)}
                                            className="w-full bg-black/40 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:border-cyan-500 outline-none transition-all placeholder:text-slate-600"
                                        />
                                    </div>
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={!couponCodeIn || couponLoading}
                                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors border border-slate-700"
                                    >
                                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                    </button>
                                </div>
                            )}
                            {couponError && <p className="text-red-400 text-xs mt-2 animate-in slide-in-from-top-1 ml-1">{couponError}</p>}
                        </div>
                    )}

                    {/* Totals */}
                    <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-slate-400">
                            <span>Subtotal</span>
                            <span>{cartTotal.toFixed(2)}{t.currency}</span>
                        </div>
                        {coupon && (
                            <div className="flex justify-between text-emerald-400 text-sm">
                                <span>Discount</span>
                                <span>-{coupon.discount.toFixed(2)}{t.currency}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                            <span className="text-lg font-bold text-white">Total</span>
                            <span className="text-2xl font-bold text-cyan-400">{finalTotal.toFixed(2)}{t.currency}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        Checkout Securely <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </>
    );
};
