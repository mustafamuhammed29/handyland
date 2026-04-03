import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Tag, X, Loader2, ShieldCheck, Truck, Trophy, Zap } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
import { getImageUrl } from '../../utils/imageUrl';
import { FREE_SHIPPING_THRESHOLD } from '../../utils/constants';
import { TrustBadges } from '../../components/products/TrustBadges';

// FIXED: Extracted from Checkout.tsx for better maintainability (FIX 5)

interface CheckoutOrderSummaryProps {
    user?: any;
    features?: any;
    appliedPoints: number;
    setAppliedPoints: (points: number) => void;
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
    taxRate: number;
}

export const CheckoutOrderSummary: React.FC<CheckoutOrderSummaryProps> = ({
    user,
    features,
    appliedPoints,
    setAppliedPoints,
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
    taxRate,
}) => {
    const { t } = useTranslation();

    return (
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sticky top-28 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-normal text-slate-500">{cart.length} Items</span>
            </h3>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar mb-6">
                {/* Free Shipping Progress */}
                {cartTotal < FREE_SHIPPING_THRESHOLD ? (
                    <div className="bg-slate-950/50 rounded-xl p-4 border border-blue-500/30 mb-4">
                        <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-blue-400">Add {formatPrice(Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal))} for Free Shipping</span>
                            <span className="text-slate-500">{Math.round((cartTotal / FREE_SHIPPING_THRESHOLD) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (cartTotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4 flex items-center gap-2 text-emerald-400 text-sm font-bold animate-in fade-in">
                        <CheckCircle className="w-4 h-4" /> You've qualified for Free Standard Shipping!
                    </div>
                )}

                {cart.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start group">
                        <div className="w-16 h-16 bg-slate-950 rounded-lg overflow-hidden flex-shrink-0 border border-slate-800 relative">
                            <img
                                src={getImageUrl(item.image)}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={(e: any) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = '/placeholder-phone.png'; }}
                            />
                            {item.quantity && item.quantity > 1 && (
                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                                    x{item.quantity}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">{item.title}</div>
                            <div className="text-xs text-slate-500 line-clamp-1">{item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : ''}</div>
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

            {/* Loyalty Points Redemption */}
            {features?.loyalty?.enabled !== false && user && (user.loyaltyPoints || 0) > 0 && (
                <div className="pt-6 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-bold text-white">HandyLand Rewards</span>
                        </div>
                        <span className="text-xs text-white/50">{user.loyaltyPoints} PTS available</span>
                    </div>
                    
                    {appliedPoints > 0 ? (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between animate-in fade-in">
                            <div className="flex items-center gap-2 text-amber-500">
                                <Zap className="w-4 h-4" />
                                <span className="font-bold text-sm">-{appliedPoints} PTS Applied</span>
                            </div>
                            <button onClick={() => setAppliedPoints(0)} aria-label="Remove points" className="text-slate-400 hover:text-white p-1 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => {
                                const availableForThisOrder = Math.min(
                                    user.loyaltyPoints,
                                    cartTotal * (features?.loyalty?.redeemRate || 100)
                                );
                                setAppliedPoints(availableForThisOrder);
                            }}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2.5 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all border border-slate-700 hover:border-amber-500/50"
                        >
                            <Trophy className="w-4 h-4 text-amber-500" /> Apply {Math.min(user.loyaltyPoints, cartTotal * (features?.loyalty?.redeemRate || 100))} Points
                        </button>
                    )}
                    {appliedPoints > 0 && (
                        <p className="text-[10px] text-slate-500 mt-2 text-center">
                            Note: {(features?.loyalty?.redeemRate || 100)} Points = {formatPrice(1)}
                        </p>
                    )}
                </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                </div>
                
                {(coupon || appliedPoints > 0) && (
                    <div className="flex justify-between text-amber-400 text-sm">
                        <span>Discount {(coupon && appliedPoints > 0) ? '(Reward + Coupon)' : coupon ? '(Coupon)' : '(Reward)'}</span>
                        <span>- {formatPrice((coupon?.discount || 0) + (appliedPoints / (features?.loyalty?.redeemRate || 100)))}</span>
                    </div>
                )}

                {/* FIXED BUG-01: Correct logic (Loyalty Discount applied BEFORE tax) */}
                {/* discountedSubtotal = cartTotal - (loyaltyDiscount + couponDiscount) */}
                {(() => {
                    const couponDiscount = coupon?.discount || 0;
                    const redeemRate = features?.loyalty?.redeemRate || 100;
                    const loyaltyDiscount = appliedPoints / redeemRate;
                    const discountedSubtotal = Math.max(0, cartTotal - loyaltyDiscount - couponDiscount);
                    const taxAmount = Math.round(discountedSubtotal * 0.19 * 100) / 100;
                    
                    const selectedMethod = (window as any).selectedShippingMethod; // We might need a better way if this isn't passed
                    // Re-calculate shipping logic to match Checkout.tsx
                    let shippingCost = 5.99;
                    if (cartTotal >= freeShippingThreshold) {
                        shippingCost = 0;
                    }

                    return (
                        <>
                            <div className="flex justify-between text-slate-400 text-sm">
                                <span>{t('checkout.tax', 'Tax (19% VAT)')}</span>
                                <span>{formatPrice(taxAmount)}</span>
                            </div>
                            <div className={`flex justify-between text-sm ${shippingCost === 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                <span>Shipping</span>
                                <span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</span>
                            </div>
                            <div className="flex justify-between text-white font-bold text-xl pt-4 border-t border-slate-800 mt-2">
                                <span>Total</span>
                                <span>{formatPrice(getFinalTotal())}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 text-right">incl. {taxRate}% VAT</p>
                        </>
                    );
                })()}
            </div>

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t border-slate-800">
                <TrustBadges className="grid-cols-2" />
            </div>
        </div>
    );
};
