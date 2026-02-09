import React from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingCart, X, Trash2, ArrowRight, Zap } from 'lucide-react';
import { LanguageCode, ViewState } from '../types';
import { translations } from '../i18n';

interface CartDrawerProps {
    lang: LanguageCode;
    setView: (view: ViewState) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ lang, setView }) => {
    const { cart, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen, cartTotal } = useCart();
    const t = translations[lang];

    const handleCheckout = () => {
        setIsCartOpen(false);
        setView(ViewState.CHECKOUT);
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
            <div className={`fixed inset-y-0 right-0 w-full md:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 transform transition-transform duration-500 z-[70] flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-black/40">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-cyan-400" /> Global Loadout
                    </h3>
                    <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                            <ShoppingCart className="w-16 h-16 mb-4" />
                            <p>Your cart is empty</p>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="flex gap-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800 animate-in slide-in-from-right-4 fade-in duration-300">
                                <img src={item.image} className="w-16 h-16 rounded-lg object-cover bg-slate-800" alt="" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
                                    <div className="text-xs text-slate-400 truncate">{item.subtitle}</div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="text-cyan-400 font-bold">{item.price}{t.currency}</div>
                                        {/* Quantity Selector */}
                                        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                                                disabled={(item.quantity || 1) <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="text-xs font-mono w-4 text-center text-white">{item.quantity || 1}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="text-slate-500 hover:text-red-400 self-start">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 border-t border-slate-800 bg-black/40">
                    <div className="flex justify-between items-center mb-4 text-lg font-bold text-white">
                        <span>Total</span>
                        <span className="text-cyan-400 text-2xl">{cartTotal}{t.currency}</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Checkout System <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </>
    );
};
