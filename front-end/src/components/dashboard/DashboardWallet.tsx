import React, { useState, useEffect } from 'react';
import { Wallet, Plus, TrendingUp, TrendingDown, Download, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { WalletTransaction } from '../../types';
import { api } from '../../utils/api';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { AddFundsModal } from './wallet/AddFundsModal';

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
    const { t } = useTranslation();
    const currentMonth = new Date().getMonth();
    const { refetch } = useDashboardData().wallet;
    const { addToast } = useToast();

    const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);

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
                    addToast(t('wallet.toast.success', 'Wallet successfully topped up! 🎉'), 'success');
                    refetch();
                })
                .catch((err: any) => {
                    const msg = err?.response?.data?.message;
                    if (msg && msg.includes('Bereits verarbeitet')) {
                        // Already processed via webhook — just refresh
                        refetch();
                    } else {
                        addToast(msg || t('wallet.toast.error', 'Error confirming payment'), 'error');
                    }
                });
        } else if (walletStatus === 'cancelled') {
            window.history.replaceState({}, '', window.location.pathname);
            addToast(t('wallet.toast.cancelled', 'Payment was cancelled.'), 'info');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleExportCSV = () => {
        if (transactions.length === 0) return;
        const rows = [
            [t('common.date', 'Date'), t('common.type', 'Type'), t('common.description', 'Description'), t('common.amount', 'Amount'), t('common.status', 'Status')],
            ...transactions.map(t_ => [
                new Date(t_.date || (t_ as any).createdAt || Date.now()).toLocaleDateString(t('common.locale', 'en-US')),
                t_.type,
                t_.description || '',
                (t_.type === 'deposit' || t_.type === 'credit' || t_.type === 'refund' ? '+' : '-') + (t_.amount?.toFixed(2) ?? '0.00'),
                t_.status
            ])
        ];
        const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wallet-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleAddFundsClick = () => {
        setIsAddFundsModalOpen(true);
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
            <h2 className="text-2xl font-bold text-white">{t('wallet.title', 'My Wallet')}</h2>

            {/* Pending Requests Banner */}
            {(() => {
                const pendingCount = transactions.filter((t: any) => t.status === 'pending').length;
                if (pendingCount === 0) return null;
                return (
                    <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-amber-300 text-sm">
                                {pendingCount === 1
                                    ? t('wallet.pending.count_one', '1 pending transfer')
                                    : t('wallet.pending.count_other', { defaultValue: '{{count}} pending transfers', count: pendingCount })}
                            </p>
                            <p className="text-amber-400/70 text-xs mt-0.5">
                                {t('wallet.pending.subtitle', 'Your balance will be credited as soon as the admin has confirmed your payment receipt.')}
                            </p>
                        </div>
                    </div>
                );
            })()}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-blue-100 mb-2 font-medium">{t('wallet.balance.label', 'Available Balance')}</div>
                        <div className="text-4xl font-bold mb-8">€{balance?.toFixed(2) || '0.00'}</div>
                        <button
                            onClick={handleAddFundsClick}
                            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> {t('wallet.balance.add', 'Add Funds')}
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col justify-center">
                    <div className="space-y-4 flex-1">
                        <div>
                            <p className="text-slate-400 text-sm">{t('wallet.stats.total', 'Total Transactions')}</p>
                            <p className="text-2xl font-bold text-white">{transactions.filter((t_any: any) => t_any.status === 'completed').length}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">{t('wallet.stats.month', 'This Month')}</p>
                            <p className="text-2xl font-bold text-emerald-400">
                                +€{transactions
                                    .filter((t_any: any) => t_any.status === 'completed' && new Date(t_any.date || Date.now()).getMonth() === currentMonth)
                                    .reduce((sum, t_any) => sum + (t_any.amount || 0), 0)
                                    .toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Mini Flow Chart */}
                    <div className="h-24 w-full mt-4 border-t border-slate-800/50 pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'In', value: transactions.filter((t: any) => (t.type === 'deposit' || t.type === 'refund') && t.status === 'completed').reduce((s, t) => s + t.amount, 0) },
                                { name: 'Out', value: transactions.filter((t: any) => t.type !== 'deposit' && t.type !== 'refund' && t.status === 'completed').reduce((s, t) => s + t.amount, 0) }
                            ]}>
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                    formatter={(val: any) => [`€${Number(val || 0).toFixed(2)}`, '']}
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
                    <h3 className="text-xl font-bold text-white">{t('wallet.list.title', 'Recent Transactions')}</h3>
                    <button
                        onClick={handleExportCSV}
                        disabled={transactions.length === 0}
                        title={t('common.exportCSV', 'Download CSV')}
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        {t('common.export', 'Export')}
                    </button>
                </div>

                <div className="space-y-3">
                    {transactions.slice(0, 10).map((transaction, idx) => {
                        const isPending = (transaction as any).status === 'pending';
                        const isFailed = (transaction as any).status === 'failed';
                        const isIncoming = transaction.type === 'deposit' || transaction.type === 'credit' || transaction.type === 'refund';

                        return (
                            <div
                                key={idx}
                                className={`flex items-center justify-between p-4 rounded-xl transition-colors border ${
                                    isPending
                                        ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
                                        : isFailed
                                        ? 'bg-red-500/5 border-red-500/20'
                                        : 'bg-slate-800/30 border-transparent hover:bg-slate-800/50'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        isPending ? 'bg-amber-500/20' :
                                        isFailed  ? 'bg-red-500/20' :
                                        isIncoming ? 'bg-emerald-600/20' : 'bg-red-600/20'
                                    }`}>
                                        {isPending ? (
                                            <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                                        ) : isFailed ? (
                                            <XCircle className="w-5 h-5 text-red-400" />
                                        ) : isIncoming ? (
                                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                                        ) : (
                                            <TrendingDown className="w-5 h-5 text-red-400" />
                                        )}
                                    </div>

                                    {/* Description + Date */}
                                    <div>
                                        <p className="text-white font-medium text-sm">
                                            {transaction.description || (transaction.type === 'deposit' ? t('wallet.transaction.deposit', 'Wallet Deposit') : t('wallet.transaction.purchase', 'Purchase'))}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {new Date(transaction.date || (transaction as any).createdAt || Date.now()).toLocaleDateString(t('common.locale', 'en-US'), { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Right side: amount + status badge */}
                                <div className="flex flex-col items-end gap-1.5">
                                    <p className={`font-bold text-sm ${
                                        isPending ? 'text-amber-400' :
                                        isFailed  ? 'text-slate-500 line-through' :
                                        isIncoming ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                        {isIncoming ? '+' : '-'}€{transaction.amount?.toFixed(2)}
                                    </p>

                                    {/* Status Badge */}
                                    {isPending && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                            <Clock className="w-2.5 h-2.5" />
                                            {t('wallet.status.pending', 'Pending — Admin Review')}
                                        </span>
                                    )}
                                    {isFailed && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                            <XCircle className="w-2.5 h-2.5" />
                                            {t('wallet.status.rejected', 'Rejected')}
                                        </span>
                                    )}
                                    {!isPending && !isFailed && (transaction as any).status === 'completed' && isIncoming && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            <CheckCircle className="w-2.5 h-2.5" />
                                            {t('wallet.status.approved', 'Approved')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {transactions.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>{t('wallet.list.empty', 'No transactions yet')}</p>
                        </div>
                    )}
                </div>
            </div>

            <AddFundsModal
                isOpen={isAddFundsModalOpen}
                onClose={() => setIsAddFundsModalOpen(false)}
                onSuccess={() => refetch()}
            />
        </div >
    );
};

