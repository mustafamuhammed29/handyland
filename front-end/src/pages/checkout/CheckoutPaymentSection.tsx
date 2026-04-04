import React from 'react';
import { CreditCard, ArrowLeft, ArrowRight, Loader2, Lock, Truck, ShieldCheck } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { api } from '../../utils/api';
import { formatPrice } from '../../utils/formatPrice';
import { useTranslation } from 'react-i18next';

// FIXED: Extracted from Checkout.tsx for better maintainability (FIX 5)

interface CheckoutPaymentSectionProps {
    selectedPaymentMethod: string;
    setSelectedPaymentMethod: (method: string) => void;
    paymentConfig: any;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    handlePaymentSuccess: () => void;
    getFinalTotal: () => number;
    onBack: () => void;
    setError: (error: string | null) => void;
    navigate: (path: string) => void;
    // PayPal props
    shippingMethods: any[];
    selectedMethodId: string;
    cart: any[];
    cartTotal: number;
    freeShippingThreshold: number;
    shippingDetails: any;
    coupon: any;
}

export const CheckoutPaymentSection: React.FC<CheckoutPaymentSectionProps> = ({
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    paymentConfig,
    loading,
    setLoading,
    handlePaymentSuccess,
    getFinalTotal,
    onBack,
    setError,
    navigate,
    shippingMethods,
    selectedMethodId,
    cart,
    cartTotal,
    freeShippingThreshold,
    shippingDetails,
    coupon,
}) => {
    const { t } = useTranslation();
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} aria-label="Back to shipping" className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-emerald-500" /> {t('checkout.payment', 'Payment')}
                </h2>
            </div>
            <h3 className="font-bold text-white mb-4">{t('checkout.paymentMethod', 'Payment Method')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {paymentConfig?.bankTransfer?.enabled !== false && (
                    <button
                        onClick={() => setSelectedPaymentMethod('bank_transfer')}
                        className={`p-6 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all ${selectedPaymentMethod === 'bank_transfer'
                            ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500 shadow-lg shadow-blue-900/20'
                            : 'bg-black/20 border-slate-700 hover:bg-slate-800/50'
                            }`}
                    >
                        <div className={`w-12 h-12 flex items-center justify-center rounded-full ${selectedPaymentMethod === 'bank_transfer' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <span className="font-bold text-white block">{t('checkout.bank_transfer', 'Bank Transfer')}</span>
                            <span className="text-xs text-slate-400">Vorkasse / Überweisung</span>
                        </div>
                    </button>
                )}

                {/* PayPal */}
                {paymentConfig?.paypal?.enabled && paymentConfig?.paypal?.clientId && (
                    <button
                        onClick={() => setSelectedPaymentMethod('paypal')}
                        className={`p-6 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all ${selectedPaymentMethod === 'paypal'
                            ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500 shadow-lg shadow-blue-900/20'
                            : 'bg-black/20 border-slate-700 hover:bg-slate-800/50'
                            }`}
                    >
                        <div className={`w-12 h-12 flex items-center justify-center rounded-full ${selectedPaymentMethod === 'paypal' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                            <svg className="w-6 h-6" viewBox="0 0 256 256" fill="currentColor">
                                <path d="M208.2,74.7c-4.4-17.7-18.7-27.1-41-28.7c-3.1-0.2-6.5-0.3-10-0.3H82.4c-6.8,0-12.7,5-13.8,11.8L40,245.8c-0.2,1.3,0.8,2.4,2,2.4 h41.8c6.1,0,11.3-4.5,12.3-10.5l8.5-59.3h27.4c29.1,0,52.3-11.8,59-42.3C195.9,114.3,197,93.6,193.3,77.5L208.2,74.7z M144.2,143.7 c-4.6,23.3-25.7,23.3-43,23.3H87.1l14.9-103.7h27.6c11.6,0,22,0.6,28.3,7C163.6,76.1,161.4,103.1,144.2,143.7z" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <span className="font-bold text-white block">PayPal</span>
                            <span className="text-xs text-slate-400">{t('checkout.fast_secure', 'Fast & Secure')}</span>
                        </div>
                    </button>
                )}

                {/* Cash on Delivery */}
                {paymentConfig?.cashOnDelivery?.enabled !== false && (
                    <button
                        onClick={() => setSelectedPaymentMethod('cod')}
                        className={`p-6 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all ${selectedPaymentMethod === 'cod'
                            ? 'bg-emerald-600/20 border-emerald-500 ring-1 ring-emerald-500 shadow-lg shadow-emerald-900/20'
                            : 'bg-black/20 border-slate-700 hover:bg-slate-800/50'
                            }`}
                    >
                        <div className={`w-12 h-12 flex items-center justify-center rounded-full ${selectedPaymentMethod === 'cod' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                            <Truck className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                            <span className="font-bold text-white block">{t('checkout.cod_title', 'Cash on Delivery')}</span>
                            <span className="text-xs text-slate-400">Nachnahme / Barzahlung</span>
                        </div>
                    </button>
                )}
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mb-8 text-center">
                <p className="text-slate-400 mb-6 text-sm">
                    {selectedPaymentMethod === 'bank_transfer' && (paymentConfig?.bankTransfer?.instructions || t('checkout.bank_instructions', "You will receive our bank details (IBAN/BIC) via email after placing the order. Your order will be shipped once the payment is received."))}
                    {selectedPaymentMethod === 'cod' && t('checkout.cod_instructions', "You will pay for your order directly to the courier upon delivery. Please have the exact amount ready.")}
                    {selectedPaymentMethod === 'paypal' && t('checkout.paypal_instructions', "You will be securely redirected to PayPal to complete your purchase.")}
                    {!selectedPaymentMethod && t('checkout.select_payment_prompt', "Please select a payment method to continue.")}
                </p>

                {selectedPaymentMethod === 'paypal' && paymentConfig?.paypal?.clientId ? (
                    <PayPalScriptProvider options={{ clientId: paymentConfig.paypal.clientId, currency: "EUR", intent: "capture" }}>
                        <PayPalButtons
                            style={{ layout: "vertical", shape: "rect", color: "blue" }}
                            createOrder={async () => {
                                const selectedMethod = shippingMethods.find((m: any) => m._id === selectedMethodId);
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
                                        street: shippingDetails.address
                                    },
                                    shippingFee: shippingCost,
                                    couponCode: coupon?.code,
                                    discountAmount: coupon?.discount
                                };

                                try {
                                    const res = await api.post('/api/payment/paypal/create-order', commonOrderData);
                                    if (res.data.success) {
                                        return res.data.id;
                                    } else {
                                        setError("Error initiating PayPal checkout");
                                        return "";
                                    }
                                } catch (error: any) {
                                    setError(error.response?.data?.message || "Failed to initiate PayPal");
                                    return "";
                                }
                            }}
                            onApprove={async (data) => {
                                try {
                                    setLoading(true);
                                    const selectedMethod = shippingMethods.find((m: any) => m._id === selectedMethodId);
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
                                            street: shippingDetails.address
                                        },
                                        shippingFee: shippingCost,
                                        couponCode: coupon?.code,
                                        discountAmount: coupon?.discount
                                    };

                                    const captureRes = await api.post('/api/payment/paypal/capture-order', {
                                        orderID: data.orderID,
                                        orderData: commonOrderData
                                    });

                                    if (captureRes.data.success) {
                                        navigate(`/payment-success?order_id=${captureRes.data.order._id}&method=paypal`);
                                    } else {
                                        setError("Failed to capture PayPal payment.");
                                        setLoading(false);
                                    }
                                } catch (error: any) {
                                    setError(error.response?.data?.message || "Error finalizing PayPal transaction.");
                                    setLoading(false);
                                }
                            }}
                            onError={(err) => {
                                console.error("PayPal Checkout Error:", err);
                                setError("An error occurred during PayPal checkout.");
                            }}
                        />
                    </PayPalScriptProvider>
                ) : (
                    <button
                        onClick={handlePaymentSuccess}
                        disabled={loading || !selectedPaymentMethod}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin w-5 h-5" /> {t('checkout.processing', 'Processing...')}
                            </>
                        ) : (
                            <>
                                {t('checkout.placeOrder', 'Place Order Securely')} <span className="ml-1">{formatPrice(getFinalTotal())}</span> <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className="flex justify-center items-center gap-6 text-slate-500 text-xs md:text-sm">
                <div className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-emerald-500" /> {t('checkout.ssl_encrypted', '256-bit SSL Encrypted')}</div>
                <div className="w-px h-3 bg-slate-700"></div>
                <div className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-500" /> {t('checkout.secure_payment', 'Secure Payment')}</div>
            </div>
        </div>
    );
};
