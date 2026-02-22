import React, { useState } from 'react';
import { Wallet, Plus, TrendingUp, TrendingDown, Download, X, CreditCard, CheckCircle, Loader2 } from 'lucide-react';
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

    // Modal State
    const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
    const [amount, setAmount] = useState<string>('50');
    const [customAmount, setCustomAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const presetAmounts = ['20', '50', '100', '200'];

    const handleAddFundsClick = () => {
        setIsSuccess(false);
        setIsAddFundsModalOpen(true);
    };

    const handleProcessPayment = async () => {
        const finalAmount = amount === 'custom' ? parseFloat(customAmount) : parseFloat(amount);

        if (isNaN(finalAmount) || finalAmount < 5) {
            addToast('Please enter a valid amount (minimum €5)', 'error');
            return;
        }

        setIsProcessing(true);

        try {
            await api.post('/api/transactions/add-funds', {
                amount: finalAmount,
                paymentMethod: paymentMethod
            });

            setIsSuccess(true);
            addToast('Funds successfully added to your wallet!', 'success');

            // Refresh wallet data silently
            refetch();

            // Auto-close after success
            setTimeout(() => {
                setIsAddFundsModalOpen(false);
                setIsProcessing(false);
            }, 2000);

        } catch (error: any) {
            console.error('Add funds error:', error);
            addToast(error.response?.data?.message || 'Failed to process payment. Please try again.', 'error');
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
                    <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export
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

                        {/* Body - Success State */}
                        {isSuccess ? (
                            <div className="p-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h4 className="text-2xl font-bold text-white mb-2">Deposit Successful</h4>
                                <p className="text-slate-400">Your wallet balance has been updated.</p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                {/* Amount Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-3">Select Amount</label>
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
                                    <div className="relative">
                                        <button
                                            onClick={() => setAmount('custom')}
                                            className={`absolute inset-y-0 left-0 pl-4 flex items-center transition-opacity ${amount === 'custom' ? 'opacity-100' : 'opacity-0 pointer-events-none'
                                                }`}
                                        >
                                            <span className="text-slate-400 font-bold">€</span>
                                        </button>
                                        <input
                                            type="number"
                                            value={customAmount}
                                            onChange={(e) => {
                                                setAmount('custom');
                                                setCustomAmount(e.target.value);
                                            }}
                                            onFocus={() => setAmount('custom')}
                                            placeholder="Custom Amount"
                                            className={`w-full py-3 rounded-xl border transition-all bg-slate-950 font-bold focus:outline-none ${amount === 'custom'
                                                ? 'pl-8 pr-4 border-blue-500 text-blue-400 ring-2 ring-blue-500/20'
                                                : 'px-4 border-slate-800 text-slate-300'
                                                }`}
                                        />
                                    </div>
                                </div>

                                {/* Payment Method (Mock) */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-3">Payment Method</label>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => setPaymentMethod('card')}
                                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${paymentMethod === 'card'
                                                ? 'bg-blue-600/10 border-blue-500'
                                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-blue-400' : 'text-slate-500'}`} />
                                                <span className={paymentMethod === 'card' ? 'text-white font-medium' : 'text-slate-300'}>Credit Card</span>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border-2 ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}`}></div>
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod('paypal')}
                                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${paymentMethod === 'paypal'
                                                ? 'bg-blue-600/10 border-blue-500'
                                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <svg className={`w-5 h-5 ${paymentMethod === 'paypal' ? 'text-blue-400' : 'text-slate-500'}`} viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zM18.846 6.82v-.006c-.475-1.196-1.554-1.854-3.411-1.854H8.76l-1.996 11.666h2.894L10.74 9.77a.64.64 0 0 1 .633-.544h1.725c2.81 0 5.462-1.258 6.138-4.996.064-.325.074-.632.062-.916h.005c0-.005.003-.01.003-.017v-.002-2.474z" />
                                                </svg>
                                                <span className={paymentMethod === 'paypal' ? 'text-white font-medium' : 'text-slate-300'}>PayPal</span>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border-2 ${paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}`}></div>
                                        </button>
                                    </div>
                                </div>

                                {/* Action */}
                                <button
                                    onClick={handleProcessPayment}
                                    disabled={isProcessing}
                                    className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Pay €{amount === 'custom' ? (customAmount || '0') : amount}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

