import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Truck, CreditCard, CheckCircle, ArrowRight, ArrowLeft, Loader2, Tag, X, Lock, User, UserPlus, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../utils/formatPrice';
import { z } from 'zod';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
// FIXED: Import extracted sub-components (FIX 5)
import { CheckoutShippingForm } from './checkout/CheckoutShippingForm';
import { CheckoutPaymentSection } from './checkout/CheckoutPaymentSection';
import { CheckoutOrderSummary } from './checkout/CheckoutOrderSummary';

// Initialize Stripe (Move to env var in production)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Removed CheckoutProps

// FIXED C-6: Strengthened Zod schema with proper regex validation
const shippingSchema = z.object({
    fullName: z.string().min(2, "Full name is required").max(100, "Name is too long"),
    email: z.string().email("Invalid email address"),
    phone: z.string().regex(/^(\+|00)?[1-9][0-9\s\-().]{6,20}$/, "Invalid phone number format"),
    address: z.string().min(5, "Address is too short").max(200, "Address is too long"),
    city: z.string().min(2, "City is required").max(100, "City name too long"),
    zipCode: z.string().regex(/^[0-9]{4,10}$/, "Invalid Zip/Postal Code (4-10 digits)"),
    country: z.string().min(2, "Country is required"),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

interface ShippingMethod {
    _id: string;
    name: string;
    description: string;
    price: number;
    duration: string;
    isExpress: boolean;
}

export const Checkout: React.FC = () => {
    const { cart, cartTotal, coupon, applyCoupon, removeCoupon } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // State
    const [step, setStep] = useState(1); // 1: Auth Choice, 2: Shipping, 3: Payment
    const [guestMode, setGuestMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Form State
    const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
    const [selectedMethodId, setSelectedMethodId] = useState<string>('');
    const [isLoadingMethods, setIsLoadingMethods] = useState(true);

    // Payment Config State
    const [paymentConfig, setPaymentConfig] = useState<any | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(''); // 'stripe', 'cod', 'paypal'


    const [shippingDetails, setShippingDetails] = useState<ShippingFormData>({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        zipCode: '',
        country: 'Germany'
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof ShippingFormData, string>>>({});

    // Coupon State (coupon itself lives in CartContext so it's shared with CartDrawer)
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);

    // Initial Check & Load Data
    const [freeShippingThreshold, setFreeShippingThreshold] = useState(100);
    const [taxRate, setTaxRate] = useState(19);

    useEffect(() => {
        // Fetch Settings & Shipping Methods
        const fetchData = async () => {
            try {
                setIsLoadingMethods(true);
                const [settingsRes, methodsRes] = await Promise.all([
                    api.get('/api/settings'),
                    orderService.fetchShippingMethods()
                ]);

                // Fetch Settings includes payment config now
                // Settings endpoint returns the object directly (api interceptor unwraps response.data)
                const settings = settingsRes as any;
                if (settings) {
                    if (settings.freeShippingThreshold !== undefined) {
                        setFreeShippingThreshold(settings.freeShippingThreshold);
                    }
                    if (settings.payment) {
                        setPaymentConfig(settings.payment);
                    }
                    if (settings.taxRate !== undefined) {
                        setTaxRate(settings.taxRate);
                    }
                }


                if (Array.isArray(methodsRes)) {
                    setShippingMethods(methodsRes);
                    // Select default (lowest price or first)
                    if (methodsRes.length > 0) {
                        const defaultMethod = methodsRes.sort((a: any, b: any) => a.price - b.price)[0];
                        setSelectedMethodId(defaultMethod._id);
                    }
                }
            } catch (err) {
            } finally {
                setIsLoadingMethods(false);
            }
        };
        fetchData();

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
            const response = await orderService.applyCoupon(couponCode, cartTotal);

            if (response.success) {
                // Save to CartContext so CartDrawer also reflects the coupon
                applyCoupon(response.couponCode, response.discount);
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

    const handleRemoveCoupon = () => {
        removeCoupon(); // removes from CartContext (shared state)
        setCouponCode('');
    };

    const getFinalTotal = () => {
        const selectedMethod = shippingMethods.find(m => m._id === selectedMethodId);
        let shippingCost = selectedMethod ? selectedMethod.price : 5.99;

        if (cartTotal >= freeShippingThreshold && selectedMethod && !selectedMethod.isExpress) {
            shippingCost = 0;
        }

        const discount = coupon ? coupon.discount : 0;
        return Math.max(0, cartTotal + shippingCost - discount);
    };

    const getShippingCostDisplay = (method: ShippingMethod) => {
        if (cartTotal >= freeShippingThreshold && !method.isExpress) {
            return 'FREE';
        }
        // FIXED: Use formatPrice for consistent currency display
        return `${formatPrice(method.price)}`;
    };

    const handlePaymentSuccess = async () => {
        if (loading) return; // Prevent double submission

        if (!selectedPaymentMethod) {
            setError("Please select a payment method.");
            return;
        }

        // Token Validation for Logged In Users handled securely via HttpOnly cookies by the API endpoints.

        setLoading(true);
        setError(null);

        // Validate Stock
        try {
            await productService.validateStock(
                cart.map(item => ({ id: item.id, quantity: item.quantity || 1, name: item.title, category: item.category }))
            );
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Some items are out of stock.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setLoading(false);
            return;
        }

        const selectedMethod = shippingMethods.find(m => m._id === selectedMethodId);
        let shippingCost = selectedMethod ? selectedMethod.price : 5.99;
        if (cartTotal >= freeShippingThreshold && selectedMethod && !selectedMethod.isExpress) {
            shippingCost = 0;
        }

        const commonOrderData = {
            items: cart.map(item => ({
                product: item.id,
                productType: item.category === 'device' ? 'Product' : 'Accessory',
                name: item.title,
                price: item.price,
                image: item.image,
                quantity: item.quantity || 1
            })),
            shippingAddress: {
                ...shippingDetails,
                street: shippingDetails.address // Fix 400 Bad Request error
            },
            // FIXED: Send shippingFee as a number, not a string
            shippingFee: shippingCost,
            shippingMethod: selectedMethod?.name || 'Standard',
            couponCode: coupon?.code,
            discountAmount: coupon?.discount,
            email: shippingDetails.email // Important for Guest Checkout
        };

        try {
            if (selectedPaymentMethod === 'cod' || selectedPaymentMethod === 'bank_transfer') {
                const r = await orderService.createOrder({
                    ...commonOrderData,
                    paymentMethod: selectedPaymentMethod === 'cod' ? 'cash' : 'bank_transfer',
                    notes: `Checkout via Web. Method: ${selectedPaymentMethod === 'cod' ? 'COD' : 'Bank Transfer'}.`
                });

                if (r.success) {
                    navigate(`/payment-success?order_id=${r.order._id}&method=${selectedPaymentMethod}`);
                }

            } else if (['stripe', 'paypal', 'klarna', 'giropay', 'sepa_debit', 'sofort'].includes(selectedPaymentMethod)) {
                // Pass the specific provider down to backend to configure Stripe
                const response = await orderService.createCheckoutSession({
                    ...commonOrderData,
                    paymentProvider: selectedPaymentMethod,
                    termsAccepted: true
                });

                if (response.url) {
                    window.location.href = response.url;
                } else {
                    throw new Error("Failed to retrieve payment URL");
                }
            } else {
                setError("Selected payment method is not supported yet.");
                setLoading(false);
            }

        } catch (err: any) {
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
                            <CheckoutShippingForm
                                formData={shippingDetails}
                                onChange={handleInputChange}
                                shippingMethods={shippingMethods}
                                selectedMethodId={selectedMethodId}
                                onMethodChange={setSelectedMethodId}
                                isLoadingMethods={isLoadingMethods}
                                getShippingCostDisplay={getShippingCostDisplay}
                                onSubmit={handleShippingSubmit}
                                formErrors={formErrors}
                                termsAccepted={termsAccepted}
                                onTermsChange={setTermsAccepted}
                                error={error}
                                onClearError={() => setError(null)}
                                user={user}
                                setShippingDetails={setShippingDetails}
                                setFormErrors={setFormErrors}
                            />
                        )}

                        {step === 3 && (
                            <CheckoutPaymentSection
                                selectedPaymentMethod={selectedPaymentMethod}
                                setSelectedPaymentMethod={setSelectedPaymentMethod}
                                paymentConfig={paymentConfig}
                                loading={loading}
                                setLoading={setLoading}
                                handlePaymentSuccess={handlePaymentSuccess}
                                getFinalTotal={getFinalTotal}
                                onBack={() => setStep(2)}
                                setError={setError}
                                navigate={navigate}
                                shippingMethods={shippingMethods}
                                selectedMethodId={selectedMethodId}
                                cart={cart}
                                cartTotal={cartTotal}
                                freeShippingThreshold={freeShippingThreshold}
                                shippingDetails={shippingDetails}
                                coupon={coupon}
                            />
                        )}
                    </div>

                    {/* FIXED: Extracted to CheckoutOrderSummary sub-component (FIX 5) */}
                    <div className="lg:col-span-1">
                        <CheckoutOrderSummary
                            cart={cart}
                            cartTotal={cartTotal}
                            coupon={coupon}
                            couponCode={couponCode}
                            setCouponCode={setCouponCode}
                            couponLoading={couponLoading}
                            couponError={couponError}
                            handleApplyCoupon={handleApplyCoupon}
                            handleRemoveCoupon={handleRemoveCoupon}
                            getFinalTotal={getFinalTotal}
                            freeShippingThreshold={freeShippingThreshold}
                            taxRate={taxRate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
