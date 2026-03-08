import React from 'react';
import { CheckCircle, Tag, X, Loader2 } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';

// FIXED: Extracted from Checkout.tsx for better maintainability (FIX 5)

interface CheckoutOrderSummaryProps {
    cart: any[];
    cartTotal: number;
    coupon: any;
    couponCode: string;
    setCouponCode: (code: string) => void;
    couponLoading: boolean;
    couponError: string | null;
    handleApplyCoupon: () => void;
    handleRemoveCoupon: () => void;
    getFinalTotal: () => number;
    freeShippingThreshold: number;
}

export const CheckoutOrderSummary: React.FC<CheckoutOrderSummaryProps> = ({
    cart,
    cartTotal,
    coupon,
    couponCode,
    setCouponCode,
    couponLoading,
    couponError,
    handleApplyCoupon,
    handleRemoveCoupon,
    getFinalTotal,
    freeShippingThreshold,
}) => {
    return (
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sticky top-28 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-normal text-slate-500">{cart.length} Items</span>
            </h3>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar mb-6">
                {/* Free Shipping Progress */}
                {cartTotal < freeShippingThreshold && (
                    <div className="bg-slate-950/50 rounded-xl p-4 border border-blue-500/30 mb-4">
                        <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-blue-400">Add {formatPrice(freeShippingThreshold - cartTotal)} for Free Shipping</span>
                            <span className="text-slate-500">{Math.round((cartTotal / freeShippingThreshold) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (cartTotal / freeShippingThreshold) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                )}
                {cartTotal >= freeShippingThreshold && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4 flex items-center gap-2 text-emerald-400 text-sm font-bold animate-in fade-in">
                        <CheckCircle className="w-4 h-4" /> You've qualified for Free Standard Shipping!
                    </div>
                )}

                {cart.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start group">
                        <div className="w-16 h-16 bg-slate-950 rounded-lg overflow-hidden flex-shrink-0 border border-slate-800 relative">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            {item.quantity && item.quantity > 1 && (
                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                                    x{item.quantity}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">{item.title}</div>
                            <div className="text-xs text-slate-500 line-clamp-1">{item.category}</div>
                            <div className="text-sm text-blue-400 font-bold mt-1">{formatPrice(item.price * (item.quantity || 1))}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Coupon Input */}
            <div className="pt-6 border-t border-slate-800">
                {coupon ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between animate-in fade-in">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <Tag className="w-4 h-4" />
                            <span className="font-bold text-sm">{coupon.code}</span>
                        </div>
                        <button onClick={handleRemoveCoupon} aria-label="Remove coupon" className="text-slate-400 hover:text-white p-1 transition-colors">
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
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                className="w-full bg-black/40 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={handleApplyCoupon}
                            disabled={!couponCode || couponLoading}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-4 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
                        >
                            {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                        </button>
                    </div>
                )}
                {couponError && <p className="text-red-400 text-xs mt-2 animate-in slide-in-from-top-1">{couponError}</p>}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 text-sm">
                    <span>Shipping</span>
                    <span>{(getFinalTotal() - (cartTotal - (coupon ? coupon.discount : 0))) === 0 ? 'FREE' : formatPrice(getFinalTotal() - (cartTotal - (coupon ? coupon.discount : 0)))}</span>
                </div>
                {coupon && (
                    <div className="flex justify-between text-emerald-400 text-sm">
                        <span>Discount</span>
                        <span>- {formatPrice(coupon.discount)}</span>
                    </div>
                )}
                <div className="flex justify-between text-white font-bold text-xl pt-4 border-t border-slate-800 mt-2">
                    <span>Total</span>
                    <span>{formatPrice(getFinalTotal())}</span>
                </div>
            </div>
        </div>
    );
};
