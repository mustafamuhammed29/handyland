import React, { useState, useEffect } from 'react';
import {
    CreditCard, ArrowLeft, ArrowRight, Loader2, Lock,
    Truck, ShieldCheck, Wallet, Building2, CheckCircle2
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { api } from '../../utils/api';
import { formatPrice } from '../../utils/formatPrice';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface Props {
    selectedPaymentMethod: string;
    setSelectedPaymentMethod: (m: string) => void;
    paymentConfig: any;
    loading: boolean;
    setLoading: (v: boolean) => void;
    handlePaymentSuccess: () => void;
    getFinalTotal: () => number;
    onBack: () => void;
    setError: (e: string | null) => void;
    navigate: (path: string) => void;
    shippingMethods: any[];
    selectedMethodId: string;
    cart: any[];
    cartTotal: number;
    freeShippingThreshold: number;
    shippingDetails: any;
    coupon: any;
}

// ─────────────────────────────────────────────────────────
// Stripe Payment Form (embedded, PCI-DSS + SCA compliant)
// ─────────────────────────────────────────────────────────
const StripePaymentForm: React.FC<{
    clientSecret: string;
    onSuccess: () => void;
    onError: (msg: string) => void;
    total: number;
}> = ({ clientSecret, onSuccess, onError, total }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setSubmitting(true);

        // confirmPayment triggers 3D Secure / SCA automatically (EU PSD2 compliant)
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/payment-success`,
            },
        });

        if (error) {
            // payment_intent.payment_failed or validation error
            onError(error.message || 'Payment failed. Please try again.');
            setSubmitting(false);
        } else {
            // Stripe redirects to return_url on success — this line rarely runs
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-slate-950 border border-slate-700 rounded-xl p-5">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                        defaultValues: {},
                    }}
                />
            </div>

            {/* German legal notice — MwSt + right of withdrawal */}
            <div className="text-xs text-slate-500 bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-1">
                <p>💳 {t('checkout.stripe_pci_notice', 'Your card data is processed exclusively by Stripe Inc. and never stored on our servers (PCI DSS Level 1).')}</p>
                <p>🔒 {t('checkout.sca_notice', '3D Secure authentication (PSD2/SCA) may be required by your bank.')}</p>
                <p>🧾 {t('checkout.vat_notice', 'All prices include 19% VAT (MwSt) as required by German law.')}</p>
            </div>

            <button
                type="submit"
                disabled={!stripe || submitting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20"
            >
                {submitting
                    ? <><Loader2 className="animate-spin w-5 h-5" /> {t('checkout.processing', 'Processing...')}</>
                    : <><Lock className="w-4 h-4" /> {t('checkout.pay_now', 'Pay Now')} {formatPrice(total)} <ArrowRight className="w-4 h-4" /></>
                }
            </button>
        </form>
    );
};

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
export const CheckoutPaymentSection: React.FC<Props> = ({
    selectedPaymentMethod, setSelectedPaymentMethod,
    paymentConfig, loading, setLoading,
    handlePaymentSuccess, getFinalTotal, onBack,
    setError, navigate,
    shippingMethods, selectedMethodId,
    cart, cartTotal, freeShippingThreshold,
    shippingDetails, coupon,
}) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const finalTotal = getFinalTotal();
    const hasEnoughBalance = user && (user.balance || 0) >= finalTotal;

    // Stripe state
    const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
    const [clientSecret, setClientSecret] = useState<string>('');
    const [stripeLoading, setStripeLoading] = useState(false);

    // Load Stripe public key and initialise Stripe.js
    useEffect(() => {
        const pk = paymentConfig?.stripe?.publicKey || import.meta.env.VITE_STRIPE_PUBLIC_KEY;
        if (pk && paymentConfig?.stripe?.enabled) {
            setStripePromise(loadStripe(pk));
        }
    }, [paymentConfig]);

    // When user selects Stripe → create PaymentIntent on backend
    useEffect(() => {
        if (selectedPaymentMethod !== 'stripe' || !stripePromise || clientSecret) return;

        const createIntent = async () => {
            setStripeLoading(true);
            setError(null);
            try {
                const selectedMethod = shippingMethods.find(m => m._id === selectedMethodId);
                let shippingFee = selectedMethod ? selectedMethod.price : 5.99;
                if (cartTotal >= freeShippingThreshold && selectedMethod && !selectedMethod.isExpress) shippingFee = 0;

                const res = await api.post('/api/payment/create-payment-intent', {
                    items: cart.map(item => ({
                        product: item.id,
                        productType: (item as any).productType || (item.category?.toLowerCase() === 'accessory' ? 'Accessory' : 'Product'),
                        name: item.title,
                        price: item.price,
                        image: item.image,
                        quantity: item.quantity || 1,
                    })),
                    shippingAddress: { ...shippingDetails, street: shippingDetails.address },
                    shippingFee,
                    couponCode: coupon?.code,
                    discountAmount: coupon?.discount,
                    termsAccepted: true,
                });

                if (res.data.clientSecret) {
                    setClientSecret(res.data.clientSecret);
                } else {
                    setError('Could not initialize payment. Please try again.');
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to initialize Stripe payment.');
            } finally {
                setStripeLoading(false);
            }
        };
        createIntent();
    }, [selectedPaymentMethod, stripePromise]);

    // Payment method cards config
    const methods = [
        ...(user ? [{
            id: 'wallet',
            label: t('checkout.wallet', 'Wallet Balance'),
            sub: `${formatPrice(user.balance || 0)} ${t('checkout.available', 'available')}`,
            icon: <Wallet className="w-6 h-6" />,
            color: 'blue',
            disabled: !hasEnoughBalance,
            disabledMsg: t('checkout.insufficient_balance', 'Insufficient balance'),
        }] : []),
        ...(paymentConfig?.stripe?.enabled && paymentConfig?.stripe?.publicKey ? [{
            id: 'stripe',
            label: t('checkout.credit_card', 'Credit / Debit Card'),
            sub: 'Visa · Mastercard · SEPA · SOFORT',
            icon: <CreditCard className="w-6 h-6" />,
            color: 'indigo',
        }] : []),
        ...(paymentConfig?.paypal?.enabled && paymentConfig?.paypal?.clientId ? [{
            id: 'paypal',
            label: 'PayPal',
            sub: t('checkout.fast_secure', 'Fast & Secure'),
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.641.641 0 0 1 .632-.544h6.964c2.884 0 4.875.635 5.913 1.888.49.596.802 1.232.93 1.89.134.686.09 1.5-.135 2.42-.83 3.447-3.274 5.188-7.264 5.188H9.93a.641.641 0 0 0-.633.543l-.796 5.046a.641.641 0 0 1-.632.545l.007.041z"/>
                </svg>
            ),
            color: 'blue',
        }] : []),
        ...(paymentConfig?.bankTransfer?.enabled !== false ? [{
            id: 'bank_transfer',
            label: t('checkout.bank_transfer', 'Bank Transfer'),
            sub: 'Vorkasse / Überweisung',
            icon: <Building2 className="w-6 h-6" />,
            color: 'yellow',
        }] : []),
        ...(paymentConfig?.cashOnDelivery?.enabled !== false ? [{
            id: 'cod',
            label: t('checkout.cod_title', 'Cash on Delivery'),
            sub: 'Nachnahme / Barzahlung',
            icon: <Truck className="w-6 h-6" />,
            color: 'emerald',
        }] : []),
    ];

    const colorMap: Record<string, string> = {
        blue: 'bg-blue-600/20 border-blue-500 ring-blue-500 text-blue-400',
        indigo: 'bg-indigo-600/20 border-indigo-500 ring-indigo-500 text-indigo-400',
        yellow: 'bg-yellow-500/20 border-yellow-500 ring-yellow-500 text-yellow-400',
        emerald: 'bg-emerald-600/20 border-emerald-500 ring-emerald-500 text-emerald-400',
    };

    // Build PayPal order data helper
    const buildPayPalOrderData = () => {
        const selectedMethod = shippingMethods.find(m => m._id === selectedMethodId);
        let shippingFee = selectedMethod ? selectedMethod.price : 5.99;
        if (cartTotal >= freeShippingThreshold && selectedMethod && !selectedMethod.isExpress) shippingFee = 0;
        return {
            items: cart.map(item => ({
                product: item.id,
                productType: (item as any).productType || (item.category?.toLowerCase() === 'accessory' ? 'Accessory' : 'Product'),
                name: item.title, price: item.price, image: item.image, quantity: item.quantity || 1,
            })),
            shippingAddress: { ...shippingDetails, street: shippingDetails.address },
            shippingFee,
            couponCode: coupon?.code,
            discountAmount: coupon?.discount,
        };
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-right-4">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} aria-label="Back to shipping" className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-emerald-500" /> {t('checkout.payment', 'Payment')}
                </h2>
            </div>

            {/* Method Selection Grid */}
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider text-slate-400">{t('checkout.paymentMethod', 'Select Payment Method')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {methods.map(m => {
                    const isSelected = selectedPaymentMethod === m.id;
                    const colors = colorMap[m.color] || colorMap.blue;
                    return (
                        <button
                            key={m.id}
                            onClick={() => !m.disabled && setSelectedPaymentMethod(m.id)}
                            disabled={m.disabled}
                            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all text-center
                                ${isSelected
                                    ? `${colors} ring-1 shadow-lg`
                                    : m.disabled
                                        ? 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'
                                        : 'bg-black/20 border-slate-700 hover:bg-slate-800/50 text-slate-400'
                                }`}
                        >
                            <div className={`w-10 h-10 flex items-center justify-center rounded-full ${isSelected ? 'bg-white/10' : 'bg-slate-800'}`}>
                                {m.icon}
                            </div>
                            <div>
                                <span className="font-bold text-white text-sm block">{m.label}</span>
                                <span className="text-[10px] text-slate-400">{m.disabled ? m.disabledMsg : m.sub}</span>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </button>
                    );
                })}
            </div>

            {/* Payment Detail Panel */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 mb-6 min-h-[120px]">

                {/* ── No selection ── */}
                {!selectedPaymentMethod && (
                    <p className="text-slate-500 text-center py-6">{t('checkout.select_payment_prompt', 'Please select a payment method to continue.')}</p>
                )}

                {/* ── Stripe Embedded Card Form ── */}
                {selectedPaymentMethod === 'stripe' && (
                    stripeLoading ? (
                        <div className="flex flex-col items-center gap-3 py-8">
                            <Loader2 className="animate-spin w-8 h-8 text-indigo-400" />
                            <span className="text-slate-400 text-sm">{t('checkout.loading_payment', 'Preparing secure payment form...')}</span>
                        </div>
                    ) : clientSecret && stripePromise ? (
                        <Elements
                            stripe={stripePromise}
                            options={{
                                clientSecret,
                                appearance: {
                                    theme: 'night',
                                    variables: {
                                        colorPrimary: '#6366f1',
                                        colorBackground: '#0f172a',
                                        colorText: '#f1f5f9',
                                        colorDanger: '#ef4444',
                                        fontFamily: 'Inter, system-ui, sans-serif',
                                        borderRadius: '12px',
                                    },
                                },
                                locale: 'de', // German locale for German customers
                            }}
                        >
                            <StripePaymentForm
                                clientSecret={clientSecret}
                                total={finalTotal}
                                onSuccess={() => {
                                    // Stripe redirects via return_url — this is a fallback
                                }}
                                onError={setError}
                            />
                        </Elements>
                    ) : (
                        <p className="text-red-400 text-sm text-center py-4">{t('checkout.stripe_init_error', 'Could not load payment form. Please try again.')}</p>
                    )
                )}

                {/* ── PayPal ── */}
                {selectedPaymentMethod === 'paypal' && paymentConfig?.paypal?.clientId && (
                    <PayPalScriptProvider options={{ clientId: paymentConfig.paypal.clientId, currency: 'EUR', intent: 'capture' }}>
                        <PayPalButtons
                            style={{ layout: 'vertical', shape: 'rect', color: 'blue', label: 'pay' }}
                            createOrder={async () => {
                                try {
                                    const res = await api.post('/api/payment/paypal/create-order', buildPayPalOrderData());
                                    if (res.data.success) return res.data.id;
                                    setError('Error initiating PayPal checkout');
                                    return '';
                                } catch (err: any) {
                                    setError(err.response?.data?.message || 'Failed to initiate PayPal');
                                    return '';
                                }
                            }}
                            onApprove={async (data) => {
                                try {
                                    setLoading(true);
                                    const captureRes = await api.post('/api/payment/paypal/capture-order', {
                                        orderID: data.orderID,
                                        orderData: buildPayPalOrderData(),
                                    });
                                    if (captureRes.data.success) {
                                        navigate(`/payment-success?order_id=${captureRes.data.order._id}&method=paypal`);
                                    } else {
                                        setError('Failed to capture PayPal payment.');
                                        setLoading(false);
                                    }
                                } catch (err: any) {
                                    setError(err.response?.data?.message || 'Error finalizing PayPal transaction.');
                                    setLoading(false);
                                }
                            }}
                            onError={(err) => {
                                console.error('PayPal error:', err);
                                setError('An error occurred during PayPal checkout.');
                            }}
                        />
                    </PayPalScriptProvider>
                )}

                {/* ── Bank Transfer ── */}
                {selectedPaymentMethod === 'bank_transfer' && (
                    <div className="space-y-4">
                        <p className="text-slate-300 text-sm">
                            {paymentConfig?.bankTransfer?.instructions || t('checkout.bank_instructions', 'Please transfer the total amount to our bank account. Use your order number as payment reference (Verwendungszweck). Your order will be shipped once payment is received.')}
                        </p>
                        {(paymentConfig?.bankTransfer?.bankName || paymentConfig?.bankTransfer?.iban) && (
                            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2 font-mono text-sm">
                                {paymentConfig.bankTransfer.bankName && <div className="flex justify-between"><span className="text-slate-400">Bank</span><span className="text-white">{paymentConfig.bankTransfer.bankName}</span></div>}
                                {paymentConfig.bankTransfer.accountHolder && <div className="flex justify-between"><span className="text-slate-400">Kontoinhaber</span><span className="text-white">{paymentConfig.bankTransfer.accountHolder}</span></div>}
                                {paymentConfig.bankTransfer.iban && <div className="flex justify-between"><span className="text-slate-400">IBAN</span><span className="text-white tracking-widest">{paymentConfig.bankTransfer.iban}</span></div>}
                                {paymentConfig.bankTransfer.bic && <div className="flex justify-between"><span className="text-slate-400">BIC</span><span className="text-white">{paymentConfig.bankTransfer.bic}</span></div>}
                            </div>
                        )}
                        <button onClick={handlePaymentSuccess} disabled={loading} className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><CheckCircle2 className="w-5 h-5" /> {t('checkout.placeOrder', 'Place Order')} — {formatPrice(finalTotal)}</>}
                        </button>
                    </div>
                )}

                {/* ── Cash on Delivery ── */}
                {selectedPaymentMethod === 'cod' && (
                    <div className="space-y-4">
                        <p className="text-slate-300 text-sm">{t('checkout.cod_instructions', 'You will pay for your order directly to the courier upon delivery. Please have the exact amount ready.')}</p>
                        <button onClick={handlePaymentSuccess} disabled={loading} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20">
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Truck className="w-5 h-5" /> {t('checkout.placeOrder', 'Place Order')} — {formatPrice(finalTotal)}</>}
                        </button>
                    </div>
                )}

                {/* ── Wallet ── */}
                {selectedPaymentMethod === 'wallet' && (
                    <div className="space-y-4">
                        <p className="text-slate-300 text-sm">{t('checkout.wallet_instructions', 'The total amount will be deducted directly from your HandyLand Wallet balance.')}</p>
                        <button onClick={handlePaymentSuccess} disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20">
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Wallet className="w-5 h-5" /> {t('checkout.pay_now', 'Pay Now')} — {formatPrice(finalTotal)}</>}
                        </button>
                    </div>
                )}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center items-center gap-4 text-slate-500 text-xs">
                <div className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-emerald-500" /> 256-bit SSL</div>
                <div className="w-px h-3 bg-slate-700" />
                <div className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-500" /> PCI DSS Compliant</div>
                <div className="w-px h-3 bg-slate-700" />
                <div className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-blue-500" /> PSD2 / SCA Ready</div>
            </div>
        </div>
    );
};
