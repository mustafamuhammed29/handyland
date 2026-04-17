import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../utils/formatPrice';

// Extracted sub-components
import { CheckoutShippingForm } from './checkout/CheckoutShippingForm';
import { CheckoutPaymentSection } from './checkout/CheckoutPaymentSection';
import { CheckoutOrderSummary } from './checkout/CheckoutOrderSummary';

// The new custom hook for business logic
import { useCheckoutLogic, ShippingMethod } from '../hooks/useCheckoutLogic';

export const Checkout: React.FC = () => {
    const { t } = useTranslation();
    
    // Deconstruct all state and logic from the hook
    const {
        step, setStep,
        guestMode, setGuestMode,
        loading, setLoading,
        error, setError,
        termsAccepted, setTermsAccepted,
        shippingMethods,
        selectedMethodId, setSelectedMethodId,
        isLoadingMethods,
        features,
        appliedPoints, setAppliedPoints,
        paymentConfig,
        selectedPaymentMethod, setSelectedPaymentMethod,
        shippingDetails, setShippingDetails,
        formErrors, setFormErrors,
        couponCode, setCouponCode,
        couponLoading,
        couponError,
        freeShippingThreshold,
        taxRate,
        user, cart, cartTotal, coupon,
        handleInputChange,
        handleShippingSubmit,
        handleApplyCoupon,
        handleRemoveCoupon,
        getFinalTotal,
        handlePaymentSuccess,
        navigate
    } = useCheckoutLogic();

    const getShippingCostDisplay = (method: ShippingMethod) => {
        if (cartTotal >= freeShippingThreshold && !method.isExpress) {
            return 'FREE';
        }
        return `${formatPrice(method.price)}`;
    };

    // --- Render Views ---

    if (step === 1 && !user && !guestMode) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto">
                        <User className="w-8 h-8 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{t('checkout.proceed_title', 'How would you like to proceed?')}</h2>
                    <p className="text-slate-400">{t('checkout.proceed_desc', 'Log in to save your order to your account, or continue as a guest.')}</p>

                    <div className="space-y-3">
                        <button onClick={() => navigate('/login?redirect=/checkout')} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">
                            {t('auth.login', 'Log In')} / {t('auth.register', 'Register')}
                        </button>
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">{t('common.or', 'Or')}</span></div>
                        </div>
                        <button onClick={() => { setGuestMode(true); setStep(2); }} className="w-full py-3 bg-transparent border border-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl transition-all">
                            {t('checkout.guest_checkout', 'Continue as Guest')}
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
                            <span className="hidden md:inline font-bold">{t('checkout.stepShipping', 'Versand')}</span>
                        </div>
                        <div className="w-16 h-1 bg-slate-800">
                            <div className={`h-full bg-blue-600 transition-all duration-500 ${step >= 3 ? 'w-full' : 'w-0'}`}></div>
                        </div>
                        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-500' : 'text-slate-600'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}>2</div>
                            <span className="hidden md:inline font-bold">{t('checkout.stepPayment', 'Zahlung')}</span>
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

                    <div className="lg:col-span-1">
                        {(() => {
                            const selectedMethod = shippingMethods.find(m => m._id === selectedMethodId);
                            let currentShippingCost = selectedMethod ? selectedMethod.price : 5.99;
                            if (cartTotal >= freeShippingThreshold && selectedMethod && !selectedMethod.isExpress) {
                                currentShippingCost = 0;
                            }
                            return (
                                <CheckoutOrderSummary
                                    user={user}
                                    features={features}
                                    appliedPoints={appliedPoints}
                                    setAppliedPoints={setAppliedPoints}
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
                                    shippingCost={currentShippingCost}
                                />
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};
