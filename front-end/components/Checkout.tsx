import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ViewState, LanguageCode } from '../types';
import { CreditCard, Truck, ShieldCheck, Lock, ArrowRight, Wallet, CheckCircle } from 'lucide-react';

interface CheckoutProps {
    setView: (view: ViewState) => void;
    lang: LanguageCode;
}

export const Checkout: React.FC<CheckoutProps> = ({ setView, lang }) => {
    const { cart, cartTotal, clearCart } = useCart();
    const { addToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            const token = localStorage.getItem('userToken');
            if (!token) {
                addToast("Please login to complete purchase", "error");
                setView(ViewState.LOGIN);
                return;
            }

            // Map cart to backend expected items format
            const items = cart.map(item => ({
                name: item.title,
                price: item.price,
                image: item.image,
                quantity: 1, // Assuming 1 for now
                product: item.id, // Assuming id is the product id
                productType: 'device' // Defaulting
            }));

            const response = await fetch('http://localhost:5000/api/payment/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items,
                    shippingAddress: {
                        line1: "123 Test St", // You might want to collect this from form
                        city: "Berlin",
                        country: "DE"
                    }
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.message || 'Payment failed');
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            addToast(error.message || "Failed to initiate payment", "error");
            setIsProcessing(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
                <div className="text-center space-y-6 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                        <CheckCircle className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h2 className="text-4xl font-black text-white">Payment Secure</h2>
                    <p className="text-slate-400">Transaction ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                    <p className="text-sm text-cyan-400 font-mono animate-pulse">Redirecting to Dashboard...</p>
                </div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-screen pt-32 text-center">
                <h2 className="text-2xl text-slate-500">Your cart is empty.</h2>
                <button onClick={() => setView(ViewState.MARKETPLACE)} className="mt-4 text-cyan-400 hover:underline">Return to Market</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-28 pb-12 px-4 max-w-7xl mx-auto">
            <h1 className="text-4xl font-black text-white mb-8 flex items-center gap-3">
                <Lock className="w-8 h-8 text-cyan-400" />
                SECURE CHECKOUT
            </h1>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Shipping */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-blue-400" /> Shipping Details
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Full Name" className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500" />
                            <input type="email" placeholder="Email Address" className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500" />
                            <input type="text" placeholder="Address Line 1" className="md:col-span-2 bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500" />
                            <input type="text" placeholder="City" className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500" />
                            <input type="text" placeholder="Postal Code" className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500" />
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-purple-400" /> Payment Method
                        </h3>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <button className="p-4 border border-cyan-500 bg-cyan-900/20 rounded-xl text-white font-bold text-sm flex flex-col items-center gap-2">
                                <CreditCard className="w-6 h-6" /> Card
                            </button>
                            <button className="p-4 border border-slate-700 bg-black/40 rounded-xl text-slate-400 hover:border-slate-500 font-bold text-sm flex flex-col items-center gap-2">
                                <Wallet className="w-6 h-6" /> Crypto
                            </button>
                            <button className="p-4 border border-slate-700 bg-black/40 rounded-xl text-slate-400 hover:border-slate-500 font-bold text-sm flex flex-col items-center gap-2">
                                <span className="text-lg font-serif">P</span> PayPal
                            </button>
                        </div>

                        <div className="space-y-3">
                            <input type="text" placeholder="Card Number" className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500" />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="MM/YY" className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500" />
                                <input type="text" placeholder="CVC" className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 sticky top-28">
                        <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>

                        <div className="space-y-4 mb-6 max-h-60 overflow-y-auto custom-scrollbar">
                            {cart.map((item, i) => (
                                <div key={i} className="flex gap-3">
                                    <img src={item.image} className="w-12 h-12 rounded bg-slate-800 object-cover" alt="" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-white truncate">{item.title}</div>
                                        <div className="text-xs text-slate-400">{item.price}€</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-slate-800 pt-4 space-y-2 mb-6">
                            <div className="flex justify-between text-slate-400 text-sm">
                                <span>Subtotal</span>
                                <span>{cartTotal}€</span>
                            </div>
                            <div className="flex justify-between text-slate-400 text-sm">
                                <span>Shipping</span>
                                <span className="text-emerald-400">Free</span>
                            </div>
                            <div className="flex justify-between text-white font-bold text-lg pt-2">
                                <span>Total</span>
                                <span className="text-cyan-400">{cartTotal}€</span>
                            </div>
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                <>
                                    Confirm Payment <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                            <ShieldCheck className="w-3 h-3" /> SSL Encrypted Transaction
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
