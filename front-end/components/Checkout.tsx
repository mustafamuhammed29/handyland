import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { LanguageCode } from '../types';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, ShieldCheck, Lock, ArrowRight, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';
import { getSecureItem, setSecureItem } from '../utils/storage';

interface CheckoutProps {
    lang: LanguageCode;
}

export const Checkout: React.FC<CheckoutProps> = ({ lang }) => {
    const { cart, cartTotal, clearCart } = useCart();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const [shippingInfo, setShippingInfo] = useState({
        fullName: '',
        email: '',
        phone: '',
        country: 'DE',
        street: '',
        city: '',
        zipCode: ''
    });

    // Load saved shipping info on mount
    React.useEffect(() => {
        const savedInfo = getSecureItem('shippingInfo');
        if (savedInfo) {
            setShippingInfo(prev => ({ ...prev, ...savedInfo }));
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setShippingInfo(prev => {
            const updated = { ...prev, [name]: value };
            // Save to secure storage with a slight delay or directly (storage ops are sync but fast enough for text input usually, 
            // but for better perf we could denounce. For now direct is fine for simple fields)
            setSecureItem('shippingInfo', updated);
            return updated;
        });
    };

    const validatePhone = (phone: string) => {
        // Regex for international phone numbers (e.g., +49..., 017...)
        const phoneRegex = /^(\+|00)[1-9][0-9 \-\(\)\.]{7,32}$|^0[1-9][0-9 \-\(\)\.]{6,32}$/;
        return phoneRegex.test(phone);
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!termsAccepted) {
            addToast("Please accept the Terms and Conditions", "error");
            return;
        }

        const { fullName, email, phone, street, city, zipCode, country } = shippingInfo;
        if (!fullName || !email || !phone || !street || !city || !zipCode) {
            addToast("Please fill in all shipping details", "error");
            return;
        }

        if (!validatePhone(phone)) {
            addToast("Please enter a valid phone number (e.g., +49 123 45678 or 0171 2345678)", "error");
            return;
        }

        setIsProcessing(true);

        try {
            // Map cart to backend expected items format
            const items = cart.map(item => ({
                name: item.title,
                price: item.price,
                image: item.image,
                quantity: 1,
                product: item.id,
                productType: 'Product'
            }));

            const data = await api.post('/api/payment/create-checkout-session', {
                items,
                shippingAddress: {
                    fullName,
                    email,
                    phone,
                    street,
                    city,
                    zipCode,
                    country
                },
                termsAccepted
            });

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.message || 'Payment failed');
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            addToast(error.message || "Failed to initiate payment", "error");
        } finally {
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
                <button onClick={() => navigate('/marketplace')} className="mt-4 text-cyan-400 hover:underline">Return to Market</button>
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
                            <input name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} type="text" placeholder="Full Name" className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500" />
                            <input name="email" value={shippingInfo.email} onChange={handleInputChange} type="email" placeholder="Email Address" className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500" />
                            <input name="phone" value={shippingInfo.phone} onChange={handleInputChange} type="tel" placeholder="Phone (+49... or 017...)" className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500" />
                            <select name="country" value={shippingInfo.country} onChange={handleInputChange} className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500">
                                <option value="DE">🇩🇪 Germany</option>
                                <option value="AT">🇦🇹 Austria</option>
                                <option value="CH">🇨🇭 Switzerland</option>
                                <option value="NL">🇳🇱 Netherlands</option>
                                <option value="BE">🇧🇪 Belgium</option>
                                <option value="FR">🇫🇷 France</option>
                                <option value="IT">🇮🇹 Italy</option>
                                <option value="ES">🇪🇸 Spain</option>
                                <option value="PL">🇵🇱 Poland</option>
                                <option value="CZ">🇨🇿 Czech Republic</option>
                                <option value="DK">🇩🇰 Denmark</option>
                                <option value="SE">🇸🇪 Sweden</option>
                                <option value="UK">🇬🇧 United Kingdom</option>
                                <option value="US">🇺🇸 United States</option>
                                <option value="TR">🇹🇷 Turkey</option>
                            </select>
                            <input name="street" value={shippingInfo.street} onChange={handleInputChange} type="text" placeholder="Address (Street, House No.)" className="md:col-span-2 bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500" />
                            <input name="city" value={shippingInfo.city} onChange={handleInputChange} type="text" placeholder="City" className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500" />
                            <input name="zipCode" value={shippingInfo.zipCode} onChange={handleInputChange} type="text" placeholder="Postal Code" className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500" />
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

                    </div>

                    {/* Terms */}
                    <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative flex items-center mt-1">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${termsAccepted ? 'bg-cyan-500 border-cyan-500' : 'bg-black/40 border-slate-600 group-hover:border-slate-500'}`}>
                                    {termsAccepted && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                </div>
                            </div>
                            <span className="text-xs text-slate-400 leading-relaxed">
                                I agree to the <span className="text-cyan-400 hover:underline">Terms of Service</span> and <span className="text-cyan-400 hover:underline">Privacy Policy</span>. I confirm that all provided shipping information is correct.
                            </span>
                        </label>
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
    );
};
