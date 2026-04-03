import React, { useState, useRef } from 'react';
import { Wallet, X, Loader2, Copy, CheckCircle, Upload, FileText, ArrowLeft, Building2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { api } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import { useSettings } from '../../../context/SettingsContext';

interface AddFundsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 'select' | 'bank_details';

export const AddFundsModal: React.FC<AddFundsModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const { settings } = useSettings();
    const paymentConfig = settings?.payment;
    const bankConfig = paymentConfig?.bankTransfer;

    const [step, setStep] = useState<Step>('select');
    const [amount, setAmount] = useState<string>('50');
    const [customAmount, setCustomAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal' | 'bank_transfer' | null>(null);

    // Bank Transfer Step 2 state
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const presetAmounts = ['20', '50', '100', '200'];

    if (!isOpen) return null;

    const getFinalAmount = () => amount === 'custom' ? parseFloat(customAmount) : parseFloat(amount);

    const handleClose = () => {
        if (isProcessing || isUploading) return;
        // Reset all state
        setStep('select');
        setAmount('50');
        setCustomAmount('');
        setSelectedMethod(null);
        setTransactionId(null);
        setReceiptFile(null);
        setReceiptPreview(null);
        onClose();
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        });
    };

    const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setReceiptFile(file);
        if (file.type.startsWith('image/')) {
            setReceiptPreview(URL.createObjectURL(file));
        } else {
            setReceiptPreview(null);
        }
    };

    const handleProcessPayment = async () => {
        const finalAmount = getFinalAmount();
        if (isNaN(finalAmount) || finalAmount < 5) {
            addToast(t('wallet.modal.error.minAmount', 'Minimum amount is 5 €'), 'error');
            return;
        }
        if (finalAmount > 5000) {
            addToast(t('wallet.modal.error.maxAmount', 'Maximum amount is 5,000 €'), 'error');
            return;
        }
        if (!selectedMethod) {
            addToast(t('wallet.modal.error.selectMethod', 'Please select a payment method'), 'error');
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
                    throw new Error(t('wallet.modal.error.noUrl', 'No checkout URL received'));
                }
            } else if (selectedMethod === 'bank_transfer') {
                // Create pending transaction first
                const res = await api.post('/api/transactions/bank-transfer', { amount: finalAmount }) as any;
                const data = res?.data || res;
                if (data?.success) {
                    setTransactionId(data.transactionId || data.transaction?._id);
                    setStep('bank_details');
                } else {
                    throw new Error(t('wallet.modal.error.createRequest', 'Error creating request'));
                }
            }
        } catch (error: any) {
            console.error('Top-up error:', error);
            addToast(error?.response?.data?.message || t('wallet.modal.error.failedContactAdmin', 'Payment failed. Please contact admin.'), 'error');
        } finally {
            if (selectedMethod !== 'stripe') {
                setIsProcessing(false);
            }
        }
    };

    const handleUploadReceipt = async () => {
        if (!receiptFile) {
            addToast(t('wallet.modal.error.noReceipt', 'Please upload your payment receipt'), 'error');
            return;
        }
        if (!transactionId) {
            addToast(t('wallet.modal.error.noTransactionId', 'Transaction ID missing'), 'error');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('receipt', receiptFile);
            const res = await api.post(`/api/transactions/${transactionId}/upload-receipt`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            } as any) as any;
            const data = res?.data || res;
            if (data?.success) {
                addToast(t('wallet.modal.success.receiptUploaded', 'Receipt uploaded! The admin will confirm your transfer.'), 'success');
                onSuccess();
                handleClose();
            } else {
                throw new Error(t('wallet.modal.error.uploadFailed', 'Upload failed'));
            }
        } catch (error: any) {
            addToast(error?.response?.data?.message || t('wallet.modal.error.uploadError', 'Error uploading receipt'), 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const finalAmount = getFinalAmount();
    const displayAmount = amount === 'custom' ? (customAmount || '0') : amount;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-h-screen">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        {step === 'bank_details' && (
                            <button
                                onClick={() => setStep('select')}
                                className="text-slate-400 hover:text-white transition-colors mr-1"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-blue-400" />
                            {step === 'select' ? t('wallet.modal.title.add', 'Add Funds') : t('wallet.modal.title.bankTransfer', 'Bank Transfer')}
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isProcessing || isUploading}
                        aria-label="Close modal"
                        title="Close modal"
                        className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">

                    {/* ===== STEP 1: Select Amount & Method ===== */}
                    {step === 'select' && (
                        <>
                            {/* Amount Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-3">{t('wallet.modal.label.selectAmount', 'Select Amount')}</label>
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
                                    placeholder={t('wallet.modal.label.customAmount', 'Custom amount (min. €5)')}
                                    title={t('wallet.modal.label.customAmount', 'Custom amount')}
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
                                <label className="block text-sm font-medium text-slate-400 mb-3">{t('wallet.modal.label.paymentMethod', 'Payment Method')}</label>
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
                                                <div className="font-bold text-white text-sm">{t('wallet.method.stripe.title', 'Credit Card (Stripe)')}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">{t('wallet.method.stripe.subtitle', 'Secure payment via Stripe')}</div>
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
                                                <div className="text-xs text-slate-400 mt-0.5">{t('wallet.method.paypal.subtitle', 'Fast and safe')}</div>
                                            </div>
                                        </label>
                                    )}

                                    {/* Bank Transfer */}
                                    {bankConfig?.enabled !== false && (
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
                                                <div className="font-bold text-white text-sm flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-blue-400" />
                                                    {t('wallet.modal.title.bankTransfer', 'Bank Transfer')}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-0.5">{t('wallet.method.bankTransfer.subtitle', 'Manual deposit receipt — admin confirmation required')}</div>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Submit Actions */}
                            {selectedMethod === 'paypal' && paymentConfig?.paypal?.clientId ? (
                                <PayPalScriptProvider options={{ clientId: paymentConfig.paypal.clientId, currency: "EUR", intent: "capture" }}>
                                    <PayPalButtons
                                        style={{ layout: "vertical", shape: "rect", color: "blue" }}
                                        createOrder={async () => {
                                            const fa = getFinalAmount();
                                            if (isNaN(fa) || fa < 5) { addToast(t('wallet.modal.error.minAmount', 'Minimum amount is 5 €'), 'error'); return ""; }
                                            try {
                                                const res: any = await api.post('/api/transactions/paypal/create-topup', { amount: fa });
                                                if (res.data?.success || res.success) return res.data?.id || res.id;
                                                addToast("Error initiating PayPal checkout", "error");
                                                return "";
                                            } catch (error: any) {
                                                addToast(error.response?.data?.message || "Failed to initiate PayPal", "error");
                                                return "";
                                            }
                                        }}
                                        onApprove={async (data) => {
                                            try {
                                                setIsProcessing(true);
                                                const res: any = await api.post('/api/transactions/paypal/capture-topup', { orderID: data.orderID });
                                                if (res.data?.success || res.success) {
                                                    addToast(t('wallet.modal.success.paypal', 'Wallet successfully topped up with PayPal! 🎉'), 'success');
                                                    handleClose(); onSuccess();
                                                } else { addToast("PayPal Payment failed", "error"); }
                                            } catch (error: any) {
                                                addToast(error.response?.data?.message || "Error finalizing PayPal transaction.", "error");
                                            } finally { setIsProcessing(false); }
                                        }}
                                        onError={(err) => { console.error("PayPal Error:", err); addToast("PayPal payment was cancelled or failed.", "error"); }}
                                    />
                                </PayPalScriptProvider>
                            ) : (
                                <button
                                    onClick={handleProcessPayment}
                                    disabled={isProcessing || !selectedMethod}
                                    className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                                >
                                    {isProcessing ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> {t('common.processing', 'Processing...')}</>
                                    ) : (
                                        <>{t('common.nextWithAmount', { defaultValue: 'Next — €{{amount}} →', amount: displayAmount })}</>
                                    )}
                                </button>
                            )}
                        </>
                    )}

                    {/* ===== STEP 2: Bank Details + Receipt Upload ===== */}
                    {step === 'bank_details' && (
                        <>
                            {/* Info Banner */}
                            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-300">
                                    <p className="font-bold mb-1">{t('wallet.modal.bank.adminRequired', 'Admin confirmation required')}</p>
                                    <p className="text-amber-400/80">{t('wallet.modal.bank.adminSubtitle', 'Your balance will be credited only after verification by the admin.')}</p>
                                </div>
                            </div>

                            {/* Transfer Amount */}
                            <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl text-center">
                                <p className="text-slate-400 text-sm mb-1">{t('wallet.modal.bank.amountToTransfer', 'Amount to transfer')}</p>
                                <p className="text-3xl font-black text-blue-400">€{finalAmount.toFixed(2)}</p>
                            </div>

                            {/* Bank Details */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-blue-400" />
                                    {t('wallet.modal.bank.detailsTitle', 'Bank Connection')}
                                </h4>
                                <div className="space-y-2 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                    {[
                                        { label: t('wallet.modal.bank.label.holder', 'Account Holder'), value: bankConfig?.accountHolder || 'HandyLand GmbH', field: 'holder' },
                                        { label: t('wallet.modal.bank.label.bank', 'Bank'), value: bankConfig?.bankName || '—', field: 'bank' },
                                        { label: 'IBAN', value: bankConfig?.iban || '—', field: 'iban' },
                                        { label: 'BIC', value: bankConfig?.bic || '—', field: 'bic' },
                                        { label: t('wallet.modal.bank.label.reference', 'Reason for payment'), value: `Wallet-${transactionId?.slice(-8).toUpperCase() || 'XXXXX'}`, field: 'ref' },
                                    ].map(({ label, value, field }) => (
                                        <div key={field} className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-700/40 last:border-0">
                                            <span className="text-xs text-slate-500 shrink-0 w-28">{label}</span>
                                            <span className={`text-sm font-mono font-semibold flex-1 truncate ${field === 'ref' ? 'text-amber-400' : 'text-white'}`}>{value}</span>
                                            {value !== '—' && (
                                                <button
                                                    onClick={() => handleCopy(value, field)}
                                                    className="text-slate-500 hover:text-blue-400 transition-colors shrink-0"
                                                    title={`${label} kopieren`}
                                                >
                                                    {copiedField === field
                                                        ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                        : <Copy className="w-4 h-4" />
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {bankConfig?.instructions && (
                                    <p className="mt-2 text-xs text-slate-500 leading-relaxed">{bankConfig.instructions}</p>
                                )}
                            </div>

                            {/* Receipt Upload */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-blue-400" />
                                    {t('wallet.modal.bank.uploadTitle', 'Upload Payment Receipt')}
                                </h4>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    onChange={handleReceiptChange}
                                    className="hidden"
                                    title={t('wallet.modal.bank.uploadTitle', 'Upload Receipt')}
                                />
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${receiptFile
                                        ? 'border-emerald-500/50 bg-emerald-500/5'
                                        : 'border-slate-700 hover:border-blue-500/50 bg-slate-800/30 hover:bg-blue-500/5'
                                        }`}
                                >
                                    {receiptPreview ? (
                                        <img src={receiptPreview} alt="Beleg Vorschau" className="max-h-32 mx-auto rounded-lg object-contain" />
                                    ) : receiptFile ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText className="w-10 h-10 text-emerald-400" />
                                            <p className="text-sm font-medium text-emerald-400">{receiptFile.name}</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="w-10 h-10 text-slate-500" />
                                            <p className="text-sm text-slate-400">{t('wallet.modal.bank.uploadPlaceholder', 'Drop receipt here or click')}</p>
                                            <p className="text-xs text-slate-600">{t('wallet.modal.bank.uploadHint', 'JPG, PNG, WebP or PDF — max. 10 MB')}</p>
                                        </div>
                                    )}
                                </div>
                                {receiptFile && (
                                    <button
                                        onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                                        className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        {t('common.removeFile', 'Remove file')}
                                    </button>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleUploadReceipt}
                                disabled={isUploading || !receiptFile}
                                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                            >
                                {isUploading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> {t('common.uploading', 'Uploading...')}</>
                                ) : (
                                    <><CheckCircle className="w-5 h-5" /> {t('wallet.modal.bank.submit', 'Submit Receipt & Send Request')}</>
                                )}
                            </button>

                            <p className="text-center text-xs text-slate-600">
                                {t('wallet.modal.bank.skipText', 'No receipt at hand? You can skip this step — your request will be saved as "pending".')}{' '}
                                <button
                                    onClick={() => { onSuccess(); handleClose(); }}
                                    className="text-blue-400 hover:text-blue-300 underline"
                                >
                                    {t('common.skipNow', 'Skip now')}
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
