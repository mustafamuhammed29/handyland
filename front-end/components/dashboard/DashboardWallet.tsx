import React, { useState, useEffect } from 'react';
import { Wallet, Plus, TrendingUp, TrendingDown, Download, X, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { WalletTransaction } from '../../types';
import { api } from '../../utils/api';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

interface DashboardWalletProps {
    balance: number;
    transactions: WalletTransaction[];
    isLoading: boolean;
    onAddFunds: () => void; // Keep for backwards compatibility, but we intercept it
}

export const DashboardWallet: React.FC<DashboardWalletProps> = ({
    balance,
    transactions,
    isLoading
}) => {
    const currentMonth = new Date().getMonth();
    const { refetch } = useDashboardData().wallet;
    const { addToast } = useToast();

    const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
    const [amount, setAmount] = useState<string>('50');
    const [customAmount, setCustomAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal' | 'bank_transfer' | null>(null);

    const { settings } = useSettings();
    const paymentConfig = settings?.payment;

    const presetAmounts = ['20', '50', '100', '200'];

    // Handle redirect back from Stripe
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const walletStatus = params.get('wallet');
        const sessionId = params.get('session_id');

        if (walletStatus === 'success' && sessionId) {
            // Remove query params from URL cleanly
            window.history.replaceState({}, '', window.location.pathname);

            // Confirm the top-up with the backend
            api.post('/api/transactions/confirm-topup', { sessionId })
                .then(() => {
                    addToast('Wallet erfolgreich aufgeladen! 🎉', 'success');
                    refetch();
                })
                .catch((err: any) => {
                    const msg = err?.response?.data?.message;
                    if (msg && msg.includes('Bereits verarbeitet')) {
                        // Already processed via webhook — just refresh
                        refetch();
                    } else {
                        addToast(msg || 'Fehler beim Bestätigen der Zahlung', 'error');
                    }
                });
        } else if (walletStatus === 'cancelled') {
            window.history.replaceState({}, '', window.location.pathname);
            addToast('Zahlung wurde abgebrochen.', 'info');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleExportCSV = () => {
        if (transactions.length === 0) return;
        const rows = [
            ['Datum', 'Typ', 'Beschreibung', 'Betrag (€)', 'Status'],
            ...transactions.map(t => [
                new Date(t.date || (t as any).createdAt || Date.now()).toLocaleDateString('de-DE'),
                t.type,
                t.description || '',
                (t.type === 'deposit' || t.type === 'credit' || t.type === 'refund' ? '+' : '-') + (t.amount?.toFixed(2) ?? '0.00'),
                t.status
            ])
        ];
        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wallet-transaktionen-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleAddFundsClick = () => {
        setIsAddFundsModalOpen(true);
    };

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
                    setIsAddFundsModalOpen(false);
                    refetch();
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

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-48 bg-slate-800/50 rounded-2xl"></div>
                <div className="h-32 bg-slate-800/50 rounded-2xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            <h2 className="text-2xl font-bold text-white">My Wallet</h2>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-blue-100 mb-2 font-medium">Available Balance</div>
                        <div className="text-4xl font-bold mb-8">€{balance?.toFixed(2) || '0.00'}</div>
                        <button
                            onClick={handleAddFundsClick}
                            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Funds
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col justify-center">
                    <div className="space-y-4 flex-1">
                        <div>
                            <p className="text-slate-400 text-sm">Total Transactions</p>
                            <p className="text-2xl font-bold text-white">{transactions.length}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">This Month</p>
                            <p className="text-2xl font-bold text-emerald-400">
                                +€{transactions
                                    .filter(t => new Date(t.date || Date.now()).getMonth() === currentMonth)
                                    .reduce((sum, t) => sum + (t.amount || 0), 0)
                                    .toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Mini Flow Chart */}
                    <div className="h-24 w-full mt-4 border-t border-slate-800/50 pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'In', value: transactions.filter(t => t.type === 'deposit' || t.type === 'refund').reduce((s, t) => s + t.amount, 0) },
                                { name: 'Out', value: transactions.filter(t => t.type !== 'deposit' && t.type !== 'refund').reduce((s, t) => s + t.amount, 0) }
                            ]}>
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                    formatter={(val: number) => [`€${val.toFixed(2)}`, '']}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {
                                        [
                                            { name: 'In', color: '#10b981' }, // Emerald
                                            { name: 'Out', color: '#ef4444' } // Red
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
                    <button
                        onClick={handleExportCSV}
                        disabled={transactions.length === 0}
                        title="CSV herunterladen"
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        Exportieren
                    </button>
                </div>

                <div className="space-y-3">
                    {transactions.slice(0, 5).map((transaction, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${transaction.type === 'deposit' || transaction.type === 'credit' || transaction.type === 'refund'
                                    ? 'bg-emerald-600/20'
                                    : 'bg-red-600/20'
                                    }`}>
                                    {transaction.type === 'deposit' || transaction.type === 'credit' || transaction.type === 'refund' ? (
                                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    ) : (
                                        <TrendingDown className="w-5 h-5 text-red-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{transaction.description || (transaction.type === 'deposit' ? 'Wallet Deposit' : 'Purchase')}</p>
                                    <p className="text-sm text-slate-400">
                                        {new Date(transaction.date || (transaction as any).createdAt || Date.now()).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <p className={`font-bold ${transaction.type === 'deposit' || transaction.type === 'credit' || transaction.type === 'refund' ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                {transaction.type === 'deposit' || transaction.type === 'credit' || transaction.type === 'refund' ? '+' : '-'}€{transaction.amount?.toFixed(2)}
                            </p>
                        </div>
                    ))}

                    {transactions.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No transactions yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Funds Modal */}
            {
                isAddFundsModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-h-screen">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                            onClick={() => !isProcessing && setIsAddFundsModalOpen(false)}
                        />

                        {/* Modal Content */}
                        <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-800">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-blue-400" /> Add Funds
                                </h3>
                                <button
                                    onClick={() => !isProcessing && setIsAddFundsModalOpen(false)}
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
                                                        setIsAddFundsModalOpen(false);
                                                        refetch();
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
                )
            }
        </div >
    );
};

