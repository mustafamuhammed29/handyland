import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Truck, CreditCard, CheckCircle, ArrowRight, ArrowLeft, Loader2, Tag, X, Lock, User, UserPlus } from 'lucide-react';
import { LanguageCode } from '../types';
import { translations } from '../i18n';
import { z } from 'zod';

// Initialize Stripe (Move to env var in production)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutProps {
    lang: LanguageCode;
}

// Zod Schema for Validation
const shippingSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(6, "Phone number is required"), // Added phone
    address: z.string().min(5, "Address is too short"),
    city: z.string().min(2, "City is required"),
    zipCode: z.string().min(4, "Invalid Zip/Postal Code"),
    country: z.string().min(2, "Country is required"),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

export const Checkout: React.FC<CheckoutProps> = ({ lang }) => {
    const { cart, cartTotal } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const t = translations[lang];

    // State
    const [step, setStep] = useState(1); // 1: Auth Choice, 2: Shipping, 3: Payment
    const [guestMode, setGuestMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Form State
    const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
    const [shippingDetails, setShippingDetails] = useState<ShippingFormData>({
        fullName: '',
        email: '',
        phone: '', // Added phone
        address: '',
        city: '',
        zipCode: '',
        country: 'Germany'
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof ShippingFormData, string>>>({});

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number } | null>(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);

    // Initial Check & Load Data
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(100);

    useEffect(() => {
        // Fetch Settings
        const fetchSettings = async () => {
            try {
                const res = await api.get<{ success: boolean, data: { freeShippingThreshold: number } }>('/api/settings');
                if (res.success && res.data.freeShippingThreshold) {
                    setFreeShippingThreshold(res.data.freeShippingThreshold);
                }
            } catch (err) {
                console.error("Failed to fetch settings", err);
            }
        };
        fetchSettings();

        if (cart.length === 0) {
            navigate('/');
            return;
        }

        // Determine initial step based on auth
        if (user) {
            setStep(2);
            let prefilledAddress = '';
            // Robust check for string address and specifically avoiding "[object Object]"
            if (typeof user.address === 'string' && user.address !== '[object Object]' && user.address.trim() !== '') {
                prefilledAddress = user.address;
            } else if (user.addresses && user.addresses.length > 0) {
                const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
                prefilledAddress = defaultAddr.street || '';
            }

            setShippingDetails(prev => ({
                ...prev,
                fullName: user.name || '',
                email: user.email || '',
                phone: user.phone || '', // Added phone prefill
                address: prefilledAddress
            }));
        }

        // Load saved shipping details from LocalStorage (overwrites user data if customized previously)
        const saved = localStorage.getItem('checkout_shipping');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Sanitize [object Object] bug
                if (parsed.address === '[object Object]') {
                    parsed.address = '';
                }
                setShippingDetails(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to parse saved checkout details", e);
            }
        }
    }, [cart, user, navigate]);

    // Save to LocalStorage on change
    useEffect(() => {
        if (step >= 2) {
            localStorage.setItem('checkout_shipping', JSON.stringify(shippingDetails));
        }
    }, [shippingDetails, step]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setShippingDetails(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (formErrors[name as keyof ShippingFormData]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleShippingSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Zod Validation
        const result = shippingSchema.safeParse(shippingDetails);
        if (!result.success) {
            const zodError = result.error;
            console.log("Validation Failed:", zodError); // Debug log

            const formattedErrors: any = {};

            // Using logic that adheres to ZodError type
            zodError.issues.forEach(issue => {
                if (issue.path[0]) {
                    formattedErrors[issue.path[0]] = issue.message;
                }
            });

            setFormErrors(formattedErrors);

            // Find first error field and scroll to it
            const firstErrorField = zodError.issues[0]?.path[0];
            if (firstErrorField) {
                const element = document.getElementsByName(firstErrorField as string)[0];
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.focus();
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
            return;
        }

        if (!termsAccepted) {
            setError("You must accept the Terms & Conditions to proceed.");
            // Scroll to the bottom where terms are
            const termsElement = document.querySelector('input[type="checkbox"]');
            if (termsElement) {
                termsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setFormErrors({});
        setError(null);
        setStep(3); // Go to Payment
        // Scroll to top for next step
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ... (keep handleApplyCoupon, removeCoupon, getFinalTotal, handlePaymentSuccess) ...

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setCouponLoading(true);
        setCouponError(null);
        try {
            const response = await api.post<any>('/api/orders/apply-coupon', {
                code: couponCode,
                cartTotal: cartTotal
            });

            if (response.success) {
                setAppliedCoupon({
                    code: response.couponCode,
                    discount: response.discount
                });
                setCouponCode('');
            } else {
                setCouponError(response.message || 'Invalid coupon');
            }
        } catch (err: any) {
            setCouponError(err.response?.data?.message || 'Failed to apply coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
    };

    const getFinalTotal = () => {
        let shipping = cartTotal >= freeShippingThreshold ? 0 : 5.99;
        if (shippingMethod === 'express') {
            shipping = 15.99; // Flat rate for express
        }
        const discount = appliedCoupon ? appliedCoupon.discount : 0;
        return Math.max(0, cartTotal + shipping - discount);
    };

    const handlePaymentSuccess = async () => {
        if (loading) return; // Prevent double submission

        // Token Validation for Logged In Users
        if (user) {
            const token = localStorage.getItem('token'); // changed from userToken to token (AuthContext uses 'token')
            if (!token) {
                setError("Session expired. Please log in again.");
                navigate('/login?redirect=/checkout');
                return;
            }
        }

        setLoading(true);
        setError(null);

        // Validate Stock
        try {
            await api.post('/api/products/validate-stock', {
                items: cart.map(item => ({ id: item.id, quantity: item.quantity || 1, name: item.title }))
            });
        } catch (err: any) {
            console.error("Stock Validation Error:", err);
            setError(err.message || "Some items are out of stock.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/api/payment/create-checkout-session', {
                items: cart.map(item => ({
                    product: item.id,
                    productType: item.category === 'device' ? 'Product' : 'Accessory',
                    name: item.title,
                    price: item.price,
                    image: item.image,
                    quantity: item.quantity || 1
                })),
                shippingAddress: shippingDetails,
                shippingFee: (shippingMethod === 'express' ? 15.99 : (cartTotal >= freeShippingThreshold ? 0 : 5.99)).toString(),
                shippingMethod: shippingMethod,
                couponCode: appliedCoupon?.code,
                discountAmount: appliedCoupon?.discount,
                email: shippingDetails.email // Important for Guest Checkout
            });

            if (response.url) {
                window.location.href = response.url;
            } else {
                throw new Error("Failed to retrieve payment URL");
            }

        } catch (err: any) {
            console.error("Payment Error:", err);
            setError(err.response?.data?.message || err.message || 'Payment initiation failed. Please try again.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setLoading(false); // Only stop loading on error, otherwise we are redirecting
        }
    };

    // ... (Render Steps) ...
    // Inside render, just ensuring the structure matches what we expect
    // ...
    // ... (Step 1 code) ...
    if (step === 1 && !user && !guestMode) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto">
                        <User className="w-8 h-8 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">How would you like to proceed?</h2>
                    <p className="text-slate-400">Log in to save your order to your account, or continue as a guest.</p>

                    <div className="space-y-3">
                        <button onClick={() => navigate('/login?redirect=/checkout')} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">
                            Log In / Register
                        </button>
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Or</span></div>
                        </div>
                        <button onClick={() => { setGuestMode(true); setStep(2); }} className="w-full py-3 bg-transparent border border-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl transition-all">
                            Continue as Guest
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 py-24 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Progress Stepper */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-500' : 'text-slate-600'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}>1</div>
                            <span className="hidden md:inline font-bold">Shipping</span>
                        </div>
                        <div className="w-16 h-1 bg-slate-800">
                            <div className={`h-full bg-blue-600 transition-all duration-500 ${step >= 3 ? 'w-full' : 'w-0'}`}></div>
                        </div>
                        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-500' : 'text-slate-600'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}>2</div>
                            <span className="hidden md:inline font-bold">Payment</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Forms */}
                    <div className="lg:col-span-2 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2">
                                <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-left-4">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Truck className="w-6 h-6 text-blue-500" /> Shipping Details
                                </h2>
                                <form onSubmit={handleShippingSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400">Full Name</label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={shippingDetails.fullName}
                                                onChange={handleInputChange}
                                                className={`w-full bg-black/40 border ${formErrors.fullName ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors`}
                                                placeholder="John Doe"
                                            />
                                            {formErrors.fullName && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.fullName}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400">Email (for order updates)</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={shippingDetails.email}
                                                onChange={handleInputChange}
                                                className={`w-full bg-black/40 border ${formErrors.email ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors`}
                                                placeholder="john@example.com"
                                            />
                                            {formErrors.email && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.email}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400">Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={shippingDetails.phone}
                                            onChange={handleInputChange}
                                            className={`w-full bg-black/40 border ${formErrors.phone ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors`}
                                            placeholder="+49 123 456789"
                                        />
                                        {formErrors.phone && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.phone}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400">Address</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={shippingDetails.address}
                                            onChange={handleInputChange}
                                            className={`w-full bg-black/40 border ${formErrors.address ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors`}
                                            placeholder="123 Tech Street"
                                        />
                                        {formErrors.address && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.address}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400">City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={shippingDetails.city}
                                                onChange={handleInputChange}
                                                className={`w-full bg-black/40 border ${formErrors.city ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors`}
                                                placeholder="Berlin"
                                            />
                                            {formErrors.city && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.city}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400">Zip Code</label>
                                            <input
                                                type="text"
                                                name="zipCode"
                                                value={shippingDetails.zipCode}
                                                onChange={handleInputChange}
                                                className={`w-full bg-black/40 border ${formErrors.zipCode ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-blue-500 outline-none rtl:text-right transition-colors`}
                                                placeholder="10115"
                                            />
                                            {formErrors.zipCode && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.zipCode}</p>}
                                        </div>
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-sm font-bold text-slate-400">Country</label>
                                            <select
                                                name="country"
                                                value={shippingDetails.country}
                                                onChange={handleInputChange}
                                                className={`w-full bg-black/40 border ${formErrors.country ? 'border-red-500 bg-red-500/5' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors`}
                                            >
                                                <option value="Germany">Germany</option>
                                                <option value="Austria">Austria</option>
                                                <option value="Switzerland">Switzerland</option>
                                            </select>
                                            {formErrors.country && <p className="text-red-500 text-xs font-semibold mt-1">{formErrors.country}</p>}
                                        </div>
                                    </div>

                                    {/* Shipping Method Selection */}
                                    <div className="pt-6 border-t border-slate-800">
                                        <h3 className="font-bold text-white mb-4">Shipping Method</h3>
                                        <div className="space-y-3">
                                            <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${shippingMethod === 'standard' ? 'bg-blue-600/10 border-blue-500' : 'bg-black/20 border-slate-700 hover:border-slate-500'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="shippingMethod"
                                                        value="standard"
                                                        checked={shippingMethod === 'standard'}
                                                        onChange={() => setShippingMethod('standard')}
                                                        className="w-4 h-4 text-blue-500 focus:ring-blue-500 bg-slate-900 border-slate-600"
                                                    />
                                                    <div>
                                                        <div className="font-bold text-white">Standard Delivery</div>
                                                        <div className="text-xs text-slate-400">3-5 Business Days</div>
                                                    </div>
                                                </div>
                                                <div className="font-bold text-white">
                                                    {cartTotal >= freeShippingThreshold ? 'FREE' : '5.99€'}
                                                </div>
                                            </label>

                                            <label className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${shippingMethod === 'express' ? 'bg-blue-600/10 border-blue-500' : 'bg-black/20 border-slate-700 hover:border-slate-500'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="shippingMethod"
                                                        value="express"
                                                        checked={shippingMethod === 'express'}
                                                        onChange={() => setShippingMethod('express')}
                                                        className="w-4 h-4 text-blue-500 focus:ring-blue-500 bg-slate-900 border-slate-600"
                                                    />
                                                    <div>
                                                        <div className="font-bold text-white">Express Delivery</div>
                                                        <div className="text-xs text-slate-400">1-2 Business Days</div>
                                                    </div>
                                                </div>
                                                <div className="font-bold text-emerald-400">15.99€</div>
                                            </label>
                                        </div>
                                    </div>

                                    <style>{`
                                        @keyframes shake {
                                            0%, 100% { transform: translateX(0); }
                                            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                                            20%, 40%, 60%, 80% { transform: translateX(4px); }
                                        }
                                        .animate-shake {
                                            animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                                        }
                                    `}</style>

                                    {/* Terms & Conditions */}
                                    <div className={`pt-4 pb-2 transition-colors duration-300 rounded-lg p-2 ${error && !termsAccepted ? 'bg-red-500/10 border border-red-500/30 animate-shake' : ''}`}>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${termsAccepted ? 'bg-blue-500 border-blue-500' : (error && !termsAccepted ? 'border-red-500' : 'border-slate-600 group-hover:border-blue-400')}`}>
                                                {termsAccepted && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={termsAccepted}
                                                onChange={e => {
                                                    setTermsAccepted(e.target.checked);
                                                    if (e.target.checked) setError(null);
                                                }}
                                                className="hidden"
                                            />
                                            <span className={`text-sm ${error && !termsAccepted ? 'text-red-400 font-bold' : 'text-slate-400'} group-hover:text-slate-300`}>
                                                I agree to the <Link to="/agb" target="_blank" className="text-blue-400 hover:underline">Terms & Conditions</Link> and <Link to="/privacy" target="_blank" className="text-blue-400 hover:underline">Privacy Policy</Link>.
                                            </span>
                                        </label>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="submit"
                                            className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                                        >
                                            Proceed to Payment <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center gap-4 mb-6">
                                    <button onClick={() => setStep(2)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <CreditCard className="w-6 h-6 text-emerald-500" /> Payment
                                    </h2>
                                </div>

                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mb-8 text-center">
                                    <p className="text-slate-400 mb-6">
                                        You are about to be redirected to our secure payment partner (Stripe) to complete your purchase.
                                    </p>

                                    <div className="flex justify-center gap-4 mb-8 grayscale opacity-70">
                                        {/* Simple CSS placeholders for card icons for now */}
                                        <div className="h-8 w-12 bg-slate-800 rounded"></div>
                                        <div className="h-8 w-12 bg-slate-800 rounded"></div>
                                        <div className="h-8 w-12 bg-slate-800 rounded"></div>
                                    </div>

                                    <button
                                        onClick={handlePaymentSuccess}
                                        disabled={loading}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="animate-spin w-5 h-5" /> Processing...
                                            </>
                                        ) : (
                                            <>
                                                Pay Securely <span className="ml-1">{getFinalTotal().toFixed(2)}{t.currency}</span> <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="flex justify-center items-center gap-6 text-slate-500 text-xs md:text-sm">
                                    <div className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-emerald-500" /> 256-bit SSL Encrypted</div>
                                    <div className="w-px h-3 bg-slate-700"></div>
                                    <div className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Secure Payment</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Order Summary (Sticky) */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sticky top-28 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
                                <span>Order Summary</span> //
                                <span className="text-xs font-normal text-slate-500">{cart.length} Items</span>
                            </h3>

                            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar mb-6">
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
                                            <div className="text-sm text-blue-400 font-bold mt-1">{(item.price * (item.quantity || 1)).toFixed(2)}{t.currency}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Coupon Input */}
                            <div className="pt-6 border-t border-slate-800">
                                {appliedCoupon ? (
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between animate-in fade-in">
                                        <div className="flex items-center gap-2 text-emerald-400">
                                            <Tag className="w-4 h-4" />
                                            <span className="font-bold text-sm">{appliedCoupon.code}</span>
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
                                    <span>{cartTotal.toFixed(2)}{t.currency}</span>
                                </div>
                                <div className="flex justify-between text-emerald-400 text-sm">
                                    <span>Shipping</span>
                                    <span>{cartTotal >= freeShippingThreshold ? 'FREE' : `5.99${t.currency}`}</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between text-emerald-400 text-sm">
                                        <span>Discount</span>
                                        <span>- {appliedCoupon.discount.toFixed(2)}{t.currency}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-white font-bold text-xl pt-4 border-t border-slate-800 mt-2">
                                    <span>Total</span>
                                    <span>{getFinalTotal().toFixed(2)}{t.currency}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
