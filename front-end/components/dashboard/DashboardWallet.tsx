import React, { useState, useEffect } from 'react';
import { Wallet, Plus, TrendingUp, TrendingDown, Download, X, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { WalletTransaction } from '../../types';
import { api } from '../../utils/api';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useToast } from '../../context/ToastContext';

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

    const handleProcessPayment = async () => {
        const finalAmount = amount === 'custom' ? parseFloat(customAmount) : parseFloat(amount);

        if (isNaN(finalAmount) || finalAmount < 5) {
            addToast('Mindestbetrag ist 5 €', 'error');
            return;
        }
        if (finalAmount > 5000) {
            addToast('Maximalbetrag ist 5.000 €', 'error');
            return;
        }

        setIsProcessing(true);

        try {
            const res = await api.post('/api/transactions/create-topup-session', { amount: finalAmount }) as any;
            const url = res?.data?.url || res?.url;
            if (url) {
                // Redirect to Stripe Checkout
                window.location.href = url;
            } else {
                throw new Error('Keine Checkout-URL erhalten');
            }
        } catch (error: any) {
            console.error('Top-up session error:', error);
            addToast(error?.response?.data?.message || 'Stripe ist nicht konfiguriert. Bitte Admin kontaktieren.', 'error');
            setIsProcessing(false);
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
                    <div className="space-y-4">
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
            {isAddFundsModalOpen && (
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
                        <div className="p-6 space-y-6">
                            {/* Info banner */}
                            <div className="flex items-start gap-3 p-3 bg-blue-600/10 border border-blue-500/30 rounded-xl">
                                <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-300">
                                    Du wirst zu <strong>Stripe</strong> weitergeleitet, um die Zahlung sicher abzuschließen. Dein Guthaben wird nach erfolgreicher Zahlung automatisch gutgeschrieben.
                                </p>
                            </div>

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

                            {/* Submit */}
                            <button
                                onClick={handleProcessPayment}
                                disabled={isProcessing}
                                className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Weiterleitung zu Stripe... </>
                                ) : (
                                    <>Mit Stripe bezahlen — €{amount === 'custom' ? (customAmount || '0') : amount}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

