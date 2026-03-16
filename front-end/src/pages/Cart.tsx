import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, ArrowRight, Minus, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { LanguageCode } from '../types';

interface CartProps {
    lang: LanguageCode;
}

export const Cart: React.FC<CartProps> = ({ lang }) => {
    const { cart, updateQuantity, removeFromCart, cartTotal, finalTotal, freeShippingThreshold } = useCart();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const isRtl = lang === 'ar';
    const isFreeShipping = finalTotal >= freeShippingThreshold;

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-slate-950 pt-32 pb-20 flex flex-col items-center justify-center text-center px-4">
                <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800">
                    <ShoppingCart className="w-12 h-12 text-slate-500" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">{t('cart.emptyTitle', 'Your Cart is Empty')}</h1>
                <p className="text-slate-400 mb-8 max-w-md">
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
        <div className="min-h-screen bg-slate-950 pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                    <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-blue-500" />
                        {t('cart.title', 'Shopping Cart')}
                        <span className="text-xl font-medium text-slate-500">({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
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
                                        src={item.image}
                                        alt={item.title || (item as any).name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'; }}
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col justify-between items-start w-full">
                                    <div className="w-full flex justify-between items-start gap-4 mb-4">
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-bold text-white line-clamp-2 leading-snug">
                                                {item.title || (item as any).name}
                                            </h3>
                                            <p className="text-slate-400 text-sm mt-1">{item.category}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-xl font-bold text-white">€{item.price.toFixed(2)}</div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="w-full flex justify-between items-center mt-auto">
                                        {/* Quantity Controls */}
                                        <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-700">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                                                title="Decrease quantity"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-10 text-center text-white font-bold">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                disabled={(item.quantity || 1) >= (item.stock || Infinity)}
                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                title="Increase quantity"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition-colors flex items-center gap-2"
                                            title="Remove Item"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                            <span className="text-sm font-medium hidden sm:inline">Remove</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-4 lg:sticky lg:top-28 self-start">
                        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 shadow-2xl rounded-2xl p-6 sm:p-8">
                            <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-4">
                                {t('cart.summary', 'Order Summary')}
                            </h2>

                            <div className="space-y-4 mb-6 text-slate-300">
                                <div className="flex justify-between items-center">
                                    <span>Subtotal</span>
                                    <span className="text-white font-medium">€{cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Shipping</span>
                                    {isFreeShipping ? (
                                        <span className="text-emerald-400 font-medium tracking-wide text-sm bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">FREE</span>
                                    ) : (
                                        <span className="text-slate-400">Calculated at checkout</span>
                                    )}
                                </div>
                                {/* Free shipping progress bar could go here */}
                                {!isFreeShipping && freeShippingThreshold > 0 && cartTotal < freeShippingThreshold && (
                                    <div className="mt-4 pt-4 border-t border-slate-800">
                                        <div className="flex justify-between text-xs text-slate-400 mb-2">
                                            <span>Add €{(freeShippingThreshold - cartTotal).toFixed(2)} for Free Shipping</span>
                                            <span>{Math.round((cartTotal / freeShippingThreshold) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                            <div 
                                                className="bg-blue-500 h-1.5 transition-all duration-500 ease-out rounded-full"
                                                style={{ width: `${Math.min((cartTotal / freeShippingThreshold) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-700 pt-6 mb-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-white">Total</span>
                                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                                        €{finalTotal.toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 text-right">Taxes included if applicable</p>
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
