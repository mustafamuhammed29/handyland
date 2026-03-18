import React, { useState } from 'react';
import { Wallet, X, Loader2 } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { api } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import { useSettings } from '../../../context/SettingsContext';

interface AddFundsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddFundsModal: React.FC<AddFundsModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { addToast } = useToast();
    const { settings } = useSettings();
    const paymentConfig = settings?.payment;

    const [amount, setAmount] = useState<string>('50');
    const [customAmount, setCustomAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal' | 'bank_transfer' | null>(null);

    const presetAmounts = ['20', '50', '100', '200'];

    if (!isOpen) return null;

    const getFinalAmount = () => amount === 'custom' ? parseFloat(customAmount) : parseFloat(amount);

    const handleProcessPayment = async () => {
        const finalAmount = getFinalAmount();

        if (isNaN(finalAmount) || finalAmount < 5) {
            addToast('Mindestbetrag ist 5 €', 'error');
            return;
        }
        if (finalAmount > 5000) {
            addToast('Maximalbetrag ist 5.000 €', 'error');
            return;
        }

        if (!selectedMethod) {
            addToast('Bitte wählen Sie eine Zahlungsmethode', 'error');
            return;
        }

        setIsProcessing(true);

        try {
            if (selectedMethod === 'stripe') {
                const res = await api.post('/api/transactions/create-topup-session', { amount: finalAmount }) as any;
                const url = res?.data?.url || res?.url;
                if (url) {
                    window.location.href = url;
                } else {
                    throw new Error('Keine Checkout-URL erhalten');
                }
            } else if (selectedMethod === 'bank_transfer') {
                const res = await api.post('/api/transactions/bank-transfer', { amount: finalAmount }) as any;
                if (res.data?.success || res.success) {
                    addToast('Banküberweisung beantragt. Bitte prüfen Sie Ihre Anweisungen.', 'success');
                    onClose();
                    onSuccess();
                } else {
                    throw new Error('Fehler beim Beantragen der Banküberweisung');
                }
            }
        } catch (error: any) {
            console.error('Top-up session error:', error);
            addToast(error?.response?.data?.message || 'Zahlung fehlgeschlagen. Bitte Admin kontaktieren.', 'error');
        } finally {
            if (selectedMethod !== 'stripe') {
                setIsProcessing(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-h-screen">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                onClick={() => !isProcessing && onClose()}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-blue-400" /> Add Funds
                    </h3>
                    <button
                        onClick={() => !isProcessing && onClose()}
                        disabled={isProcessing}
                        aria-label="Close modal"
                        title="Close modal"
                        className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Amount Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-3">Betrag auswählen</label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            {presetAmounts.map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => setAmount(preset)}
                                    className={`py-3 rounded-xl border font-bold transition-all ${amount === preset
                                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                        }`}
                                >
                                    €{preset}
                                </button>
                            ))}
                        </div>
                        <input
                            type="number"
                            value={customAmount}
                            onChange={(e) => { setAmount('custom'); setCustomAmount(e.target.value); }}
                            onFocus={() => setAmount('custom')}
                            placeholder="Eigener Betrag (min. €5)"
                            title="Eigener Betrag"
                            min="5"
                            max="5000"
                            className={`w-full px-4 py-3 rounded-xl border transition-all bg-slate-950 font-bold focus:outline-none ${amount === 'custom'
                                ? 'border-blue-500 text-blue-400 ring-2 ring-blue-500/20'
                                : 'border-slate-800 text-slate-300'
                                }`}
                        />
                    </div>

                    {/* Payment Method Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-3">Zahlungsmethode</label>
                        <div className="space-y-3">
                            {/* Stripe / Credit Card */}
                            {paymentConfig?.stripe?.enabled !== false && (
                                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedMethod === 'stripe' ? 'bg-blue-600/20 border-blue-500 shadow-sm shadow-blue-500/20' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                                    <input
                                        type="radio"
                                        name="walletPaymentMethod"
                                        value="stripe"
                                        checked={selectedMethod === 'stripe'}
                                        onChange={() => setSelectedMethod('stripe')}
                                        className="w-4 h-4 text-blue-500 focus:ring-blue-500 bg-slate-900 border-slate-600"
                                    />
                                    <div className="flex-1">
                                        <div className="font-bold text-white text-sm">Credit Card (Stripe)</div>
                                        <div className="text-xs text-slate-400 mt-0.5">Secure payment via Stripe</div>
                                    </div>
                                </label>
                            )}

                            {/* PayPal */}
                            {paymentConfig?.paypal?.enabled && paymentConfig?.paypal?.clientId && (
                                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedMethod === 'paypal' ? 'bg-blue-600/20 border-blue-500 shadow-sm shadow-blue-500/20' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                                    <input
                                        type="radio"
                                        name="walletPaymentMethod"
                                        value="paypal"
                                        checked={selectedMethod === 'paypal'}
                                        onChange={() => setSelectedMethod('paypal')}
                                        className="w-4 h-4 text-blue-500 focus:ring-blue-500 bg-slate-900 border-slate-600"
                                    />
                                    <div className="flex-1">
                                        <div className="font-bold text-white text-sm">PayPal</div>
                                        <div className="text-xs text-slate-400 mt-0.5">Fast and safe</div>
                                    </div>
                                    <svg className="w-6 h-6 text-[#00457C]" viewBox="0 0 256 256" fill="currentColor">
                                        <path d="M208.2,74.7c-4.4-17.7-18.7-27.1-41-28.7c-3.1-0.2-6.5-0.3-10-0.3H82.4c-6.8,0-12.7,5-13.8,11.8L40,245.8c-0.2,1.3,0.8,2.4,2,2.4 h41.8c6.1,0,11.3-4.5,12.3-10.5l8.5-59.3h27.4c29.1,0,52.3-11.8,59-42.3C195.9,114.3,197,93.6,193.3,77.5L208.2,74.7z M144.2,143.7 c-4.6,23.3-25.7,23.3-43,23.3H87.1l14.9-103.7h27.6c11.6,0,22,0.6,28.3,7C163.6,76.1,161.4,103.1,144.2,143.7z" />
                                    </svg>
                                </label>
                            )}

                            {/* Bank Transfer */}
                            {paymentConfig?.bankTransfer?.enabled !== false && (
                                <div>
                                    <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedMethod === 'bank_transfer' ? 'bg-blue-600/20 border-blue-500 shadow-sm shadow-blue-500/20' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                                        <input
                                            type="radio"
                                            name="walletPaymentMethod"
                                            value="bank_transfer"
                                            checked={selectedMethod === 'bank_transfer'}
                                            onChange={() => setSelectedMethod('bank_transfer')}
                                            className="w-4 h-4 text-blue-500 focus:ring-blue-500 bg-slate-900 border-slate-600"
                                        />
                                        <div className="flex-1">
                                            <div className="font-bold text-white text-sm">Bank Transfer</div>
                                            <div className="text-xs text-slate-400 mt-0.5">Manual deposit</div>
                                        </div>
                                    </label>
                                    {selectedMethod === 'bank_transfer' && (
                                        <div className="mt-2 p-3 bg-slate-800 rounded-lg border border-slate-700 text-xs text-slate-300">
                                            {paymentConfig?.bankTransfer?.instructions || "Transfer funds to our bank account. Your wallet will be credited once payment clears."}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Actions */}
                    {selectedMethod === 'paypal' && paymentConfig?.paypal?.clientId ? (
                        <PayPalScriptProvider options={{ clientId: paymentConfig.paypal.clientId, currency: "EUR", intent: "capture" }}>
                            <PayPalButtons
                                style={{ layout: "vertical", shape: "rect", color: "blue" }}
                                createOrder={async () => {
                                    const finalAmount = getFinalAmount();
                                    if (isNaN(finalAmount) || finalAmount < 5) {
                                        addToast('Mindestbetrag ist 5 €', 'error');
                                        return "";
                                    }
                                    try {
                                        const res: any = await api.post('/api/transactions/paypal/create-topup', { amount: finalAmount });
                                        if (res.data?.success || res.success) {
                                            return res.data?.id || res.id;
                                        }
                                        addToast("Error initiating PayPal checkout", "error");
                                        return "";
                                    } catch (error: any) {
                                        addToast(error.response?.data?.message || "Failed to initiate PayPal", "error");
                                        return "";
                                    }
                                }}
                                onApprove={async (data, actions) => {
                                    try {
                                        setIsProcessing(true);
                                        const res: any = await api.post('/api/transactions/paypal/capture-topup', { orderID: data.orderID });
                                        if (res.data?.success || res.success) {
                                            addToast('Wallet erfolgreich mit PayPal aufgeladen! 🎉', 'success');
                                            onClose();
                                            onSuccess();
                                        } else {
                                            addToast("PayPal Payment failed", "error");
                                        }
                                    } catch (error: any) {
                                        addToast(error.response?.data?.message || "Error finalizing PayPal transaction.", "error");
                                    } finally {
                                        setIsProcessing(false);
                                    }
                                }}
                                onError={(err) => {
                                    console.error("PayPal Error:", err);
                                    addToast("PayPal payment was cancelled or failed.", "error");
                                }}
                            />
                        </PayPalScriptProvider>
                    ) : (
                        <button
                            onClick={handleProcessPayment}
                            disabled={isProcessing || !selectedMethod}
                            className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Verarbeitung... </>
                            ) : (
                                <>Weiter — €{amount === 'custom' ? (customAmount || '0') : amount}</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
