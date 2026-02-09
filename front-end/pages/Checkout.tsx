import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Truck, CreditCard, CheckCircle, ArrowRight, ArrowLeft, Loader2, Tag, X } from 'lucide-react';
import { LanguageCode } from '../types';
import { translations } from '../i18n';

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51QoeSII1fjsqJ2kX2XqQU4fTqQvK2q6pQZ8q8q8q8q8q8q8q8q8q8q8q'); // Use env var in production

interface CheckoutProps {
    lang: LanguageCode;
}

export const Checkout: React.FC<CheckoutProps> = ({ lang }) => {
    const { cart, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const t = translations[lang];

    const [step, setStep] = useState(1); // 1: Shipping, 2: Payment
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number } | null>(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);

    const [shippingDetails, setShippingDetails] = useState({
        fullName: user?.name || '',
        email: user?.email || '',
        address: user?.address || '',
        city: '',
        zipCode: '',
        country: 'Germany'
    });

    useEffect(() => {
        if (cart.length === 0) {
            navigate('/');
        }
        // Load saved shipping details
        const saved = localStorage.getItem('checkout_shipping');
        if (saved) {
            setShippingDetails(prev => ({ ...prev, ...JSON.parse(saved) }));
        }
    }, [cart, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setShippingDetails(prev => {
            const updated = { ...prev, [name]: value };
            localStorage.setItem('checkout_shipping', JSON.stringify(updated));
            return updated;
        });
    };

    const handleShippingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validation logic here
        if (!shippingDetails.fullName || !shippingDetails.address || !shippingDetails.city || !shippingDetails.zipCode) {
            setError('Please fill in all shipping fields');
            return;
        }
        setError(null);
        setStep(2);
    };

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
        const shipping = cartTotal > 100 ? 0 : 5.99;
        const discount = appliedCoupon ? appliedCoupon.discount : 0;
        return Math.max(0, cartTotal + shipping - discount);
    };

    const handlePaymentSuccess = async (paymentMethod: any) => {
        setLoading(true);
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
                couponCode: appliedCoupon?.code, // Send coupon code to backend
                discountAmount: appliedCoupon?.discount // Send discount amount for verification
            });

            if (response.url) {
                window.location.href = response.url;
            }

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Payment initiation failed');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-slate-950 py-20 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Stepper */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-500' : 'text-slate-600'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}>1</div>
                            <span className="hidden md:inline font-bold">Shipping</span>
                        </div>
                        <div className="w-16 h-1 bg-slate-800">
                            <div className={`h-full bg-blue-600 transition-all duration-500 ${step >= 2 ? 'w-full' : 'w-0'}`}></div>
                        </div>
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-500' : 'text-slate-600'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}>2</div>
                            <span className="hidden md:inline font-bold">Payment</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5" />
                                {error}
                            </div>
                        )}

                        {step === 1 && (
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
                                                className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={shippingDetails.email}
                                                onChange={handleInputChange}
                                                className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400">Address</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={shippingDetails.address}
                                            onChange={handleInputChange}
                                            className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                            placeholder="123 Tech Street"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400">City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={shippingDetails.city}
                                                onChange={handleInputChange}
                                                className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                                placeholder="Berlin"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-400">Zip Code</label>
                                            <input
                                                type="text"
                                                name="zipCode"
                                                value={shippingDetails.zipCode}
                                                onChange={handleInputChange}
                                                className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none rtl:text-right"
                                                placeholder="10115"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-sm font-bold text-slate-400">Country</label>
                                            <select
                                                name="country"
                                                value={shippingDetails.country}
                                                onChange={(e) => setShippingDetails(prev => ({ ...prev, country: e.target.value }))}
                                                className="w-full bg-black/40 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                            >
                                                <option value="Germany">Germany</option>
                                                <option value="Austria">Austria</option>
                                                <option value="Switzerland">Switzerland</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="submit"
                                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                                        >
                                            Proceed to Payment <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center gap-4 mb-6">
                                    <button onClick={() => setStep(1)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <CreditCard className="w-6 h-6 text-emerald-500" /> Payment
                                    </h2>
                                </div>

                                <p className="text-slate-400 mb-6">
                                    You will be redirected to Stripe to securely complete your payment.
                                </p>

                                <button
                                    onClick={() => handlePaymentSuccess(null)}
                                    disabled={loading}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin w-5 h-5" /> Processing...
                                        </>
                                    ) : (
                                        <>
                                            Pay Securely with Card <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>

                                <div className="mt-4 flex justify-center items-center gap-4 text-slate-600">
                                    <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> SSL Secure</div>
                                    <div className="w-px h-3 bg-slate-700"></div>
                                    <div>256-bit Encryption</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 sticky top-24">
                            <h3 className="text-xl font-bold text-white mb-4">Order Summary</h3>
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex gap-3 items-start">
                                        <div className="w-16 h-16 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white line-clamp-2">{item.title}</div>
                                            <div className="text-xs text-slate-500">Qty: {item.quantity || 1}</div>
                                            <div className="text-sm text-blue-400 font-bold">{(item.price * (item.quantity || 1)).toFixed(2)}{t.currency}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Coupon Input */}
                            <div className="mt-6 pt-6 border-t border-slate-800">
                                {appliedCoupon ? (
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-emerald-400">
                                            <Tag className="w-4 h-4" />
                                            <span className="font-bold text-sm">{appliedCoupon.code}</span>
                                        </div>
                                        <button onClick={removeCoupon} className="text-slate-400 hover:text-white p-1">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative flex gap-2">
                                        <div className="relative flex-1">
                                            <Tag className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                            <input
                                                type="text"
                                                placeholder="Promo Code"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value)}
                                                className="w-full bg-black/40 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={handleApplyCoupon}
                                            disabled={!couponCode || couponLoading}
                                            className="bg-slate-800 hover:bg-slate-700 text-white px-4 rounded-xl text-sm font-bold disabled:opacity-50"
                                        >
                                            {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                        </button>
                                    </div>
                                )}
                                {couponError && <p className="text-red-400 text-xs mt-2">{couponError}</p>}
                            </div>


                            <div className="mt-6 pt-6 border-t border-slate-800 space-y-2">
                                <div className="flex justify-between text-slate-400">
                                    <span>Subtotal</span>
                                    <span>{cartTotal.toFixed(2)}{t.currency}</span>
                                </div>
                                <div className="flex justify-between text-emerald-400 text-sm">
                                    <span>Shipping</span>
                                    <span>{cartTotal > 100 ? 'FREE' : `5.99${t.currency}`}</span>
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
