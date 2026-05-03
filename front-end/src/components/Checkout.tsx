import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, ShieldCheck, Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';
import { getSecureItem, setSecureItem } from '../utils/storage';
import { z } from 'zod';

const shippingSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(
    /^(\+|00)[1-9][0-9 \-\(\)\.]{7,32}$|^0[1-9][0-9 \-\(\)\.]{6,32}$/,
    'Invalid phone number'
  ),
  street: z.string().min(5, 'Address is too short'),
  city: z.string().min(2, 'City is required'),
  zipCode: z.string().regex(/^\d{4,10}$/, 'Invalid postal code'),
  country: z.string().length(2, 'Select a country'),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

export const Checkout: React.FC = () => {
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

        const result = shippingSchema.safeParse(shippingInfo);
        if (!result.success) {
            const firstError = result.error.issues[0];
            addToast(firstError.message, "error");
            return;
        }

        const { fullName, email, phone, street, city, zipCode, country } = shippingInfo;

        setIsProcessing(true);

        try {
            // Map cart to backend expected items format
            const items = cart.map(item => ({
                name: item.title,
                price: item.price,
                image: item.image,
                quantity: item.quantity || 1,
                product: item.id,
                productType: ((item.category as string) === 'accessory' || (item.category as string) === 'Accessory') ? 'Accessory' : 'Product'
            }));

            const res = await api.post('/api/payment/create-checkout-session', {
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
            }) as any;

            const url = res?.data?.url || res?.url;
            if (url) {
                window.location.href = url;
            } else {
                throw new Error(res?.data?.message || res?.message || 'Payment failed');
            }
        } catch (error: any) {
            addToast(error.message || "Failed to initiate payment", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-[100dvh] pt-24 pb-12 flex items-center justify-center">
                <div className="text-center space-y-6 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                        <CheckCircle className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h2 className="text-4xl font-black text-white">Order Placed! 🎉</h2>
                    <p className="text-slate-400">You'll receive a confirmation email shortly.</p>
                    <p className="text-sm text-brand-primary font-mono animate-pulse">Redirecting to Dashboard...</p>
                </div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-[100dvh] pt-32 text-center">
                <h2 className="text-2xl text-slate-500">Your cart is empty.</h2>
                <button onClick={() => navigate('/marketplace')} className="mt-4 text-brand-primary hover:underline">Return to Market</button>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] pt-28 pb-12 px-4 max-w-7xl mx-auto">
            <h1 className="text-4xl font-black text-white mb-8 flex items-center gap-3">
                <Lock className="w-8 h-8 text-brand-primary" />
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
                            <input name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} type="text" placeholder="Full Name" className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-brand-primary" />
                            <input name="email" value={shippingInfo.email} onChange={handleInputChange} type="email" placeholder="Email Address" className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-brand-primary" />
                            <input name="phone" value={shippingInfo.phone} onChange={handleInputChange} type="tel" placeholder="Phone (+49... or 017...)" className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-brand-primary" />
                            <select name="country" title="Shipping country" value={shippingInfo.country} onChange={handleInputChange} className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-brand-primary">
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
                            <input name="street" value={shippingInfo.street} onChange={handleInputChange} type="text" placeholder="Address (Street, House No.)" className="md:col-span-2 bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-brand-primary" />
                            <input name="city" value={shippingInfo.city} onChange={handleInputChange} type="text" placeholder="City" className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-brand-primary" />
                            <input name="zipCode" value={shippingInfo.zipCode} onChange={handleInputChange} type="text" placeholder="Postal Code" className="bg-black/50 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-brand-primary" />
                        </div>
                    </div>

                    {/* Payment via Stripe */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-purple-400" /> Secure Payment
                        </h3>
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-600/10 border border-blue-500/20">
                            <ShieldCheck className="w-8 h-8 text-blue-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-white font-bold mb-1">Pay securely via Stripe</p>
                                <p className="text-slate-400 text-sm">After confirming, you'll be redirected to Stripe's encrypted checkout to complete payment with card, Apple Pay, or Google Pay.</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                            <Lock className="w-4 h-4 text-slate-500" />
                            <span className="text-xs text-slate-500">256-bit SSL · PCI-DSS Compliant · Powered by Stripe</span>
                        </div>
                    </div>
                </div>

                {/* Right: Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 sticky top-28">
                        <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>

                        {/* Order Summary Items */}
                        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar">
                            {cart.map((item, index) => (
                                <div key={item.id || index} className="flex items-center gap-3 py-2">
                                    <div className="relative">
                                    <img 
                                        src={item.image} 
                                        alt={item.title}
                                        className="w-12 h-12 object-cover rounded-lg"
                                    />
                                    {(item.quantity || 1) > 1 && (
                                        <span className="absolute -top-1 -right-1 bg-brand-primary text-white 
                                                        text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                        {item.quantity}
                                        </span>
                                    )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">
                                        {item.title || (item as any).name || 'Product'}
                                    </p>
                                    <p className="text-slate-400 text-xs">
                                        Qty: {item.quantity || 1}
                                    </p>
                                    </div>
                                    <span className="text-white font-semibold text-sm">
                                    {((item.price) * (item.quantity || 1)).toFixed(2)} €
                                    </span>
                                </div>
                            ))}
                            
                            <div className="border-t border-slate-700 pt-3 space-y-2 text-sm">
                                <div className="flex justify-between text-slate-400">
                                    <span>Subtotal</span>
                                    <span>{cartTotal.toFixed(2)}€</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>VAT (19%)</span>
                                    <span>{(cartTotal * 0.19).toFixed(2)}€</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Shipping</span>
                                    <span className="text-green-400">
                                        {cartTotal >= 100 ? 'Free' : '5.99€'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-white font-bold text-base border-t border-slate-700 pt-2">
                                    <span>Total</span>
                                    <span>
                                        {(cartTotal * 1.19 + (cartTotal >= 100 ? 0 : 5.99)).toFixed(2)}€
                                    </span>
                                </div>
                            </div>
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
                                <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${termsAccepted ? 'bg-brand-primary border-brand-primary' : 'bg-black/40 border-slate-600 group-hover:border-slate-500'}`}>
                                    {termsAccepted && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                </div>
                            </div>
                            <span className="text-xs text-slate-400 leading-relaxed">
                                I agree to the <span className="text-brand-primary hover:underline">Terms of Service</span> and <span className="text-brand-primary hover:underline">Privacy Policy</span>. I confirm that all provided shipping information is correct.
                            </span>
                        </label>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary hover:to-brand-secondary text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
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
