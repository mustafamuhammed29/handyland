import React, { useState, useEffect } from 'react';
import { Wallet, Plus, TrendingUp, TrendingDown, Download, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell, XAxis, YAxis } from 'recharts';
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
    const { t, i18n } = useTranslation();
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
                new Date(t_.date || (t_ as any).createdAt || Date.now()).toLocaleDateString(i18n.language),
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
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('wallet.title', 'My Wallet')}</h2>

            {/* Pending Requests Banner */}
            {(() => {
                const pendingCount = transactions.filter((t: any) => t.status === 'pending').length;
                if (pendingCount === 0) return null;
                return (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl animate-in fade-in slide-in-from-top-2 shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-amber-900 dark:text-amber-300 text-sm">
                                {pendingCount === 1
                                    ? t('wallet.pending.count_one', '1 pending transfer')
                                    : t('wallet.pending.count_other', { defaultValue: '{{count}} pending transfers', count: pendingCount })}
                            </p>
                            <p className="text-amber-700 dark:text-amber-400/70 text-xs mt-0.5">
                                {t('wallet.pending.subtitle', 'Your balance will be credited as soon as the admin has confirmed your payment receipt.')}
                            </p>
                        </div>
                    </div>
                );
            })()}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-800 dark:from-blue-600 dark:to-blue-900 rounded-3xl p-8 text-white relative overflow-hidden group shadow-lg shadow-blue-900/20">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-blue-100 mb-2 font-medium">{t('wallet.balance', 'Available Balance')}</div>
                        <div className="text-4xl font-black mb-8 tracking-tight">€{balance?.toFixed(2) || '0.00'}</div>
                        <button
                            onClick={handleAddFundsClick}
                            className="bg-white text-blue-700 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> {t('wallet.add_funds', 'Add Funds')}
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 flex flex-col justify-center shadow-sm">
                    <div className="space-y-4 flex-1">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('wallet.total_tx', 'Total Transactions')}</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{transactions.filter((t_any: any) => t_any.status === 'completed').length}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('wallet.this_month', 'This Month')}</p>
                            {(() => {
                                const thisMonthTotal = transactions
                                    .filter((t: any) => t.status === 'completed' && new Date(t.date || t.createdAt || Date.now()).getMonth() === currentMonth)
                                    .reduce((sum, t) => {
                                        const isIncoming = t.type === 'deposit' || t.type === 'credit' || t.type === 'refund';
                                        return sum + (isIncoming ? (t.amount || 0) : -(t.amount || 0));
                                    }, 0);
                                return (
                                    <p className={`text-2xl font-black tracking-tight ${thisMonthTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {thisMonthTotal > 0 ? '+' : ''}€{thisMonthTotal.toFixed(2)}
                                    </p>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Mini Flow Chart */}
                    <div className="h-32 w-full mt-4 border-t border-slate-200 dark:border-slate-800/50 pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: t('wallet.in', 'In'), value: transactions.filter((t: any) => (t.type === 'deposit' || t.type === 'refund') && t.status === 'completed').reduce((s, t) => s + t.amount, 0) },
                                { name: t('wallet.out', 'Out'), value: transactions.filter((t: any) => t.type !== 'deposit' && t.type !== 'refund' && t.status === 'completed').reduce((s, t) => s + t.amount, 0) }
                            ]} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: 'var(--tw-colors-slate-900, #0f172a)', borderColor: 'var(--tw-colors-slate-800, #1e293b)', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                    formatter={(val: any) => [`€${Number(val || 0).toFixed(2)}`, '']}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                    {
                                        [
                                            { name: 'In', color: '#059669' }, // Emerald-600
                                            { name: 'Out', color: '#dc2626' } // Red-600
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
            <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('wallet.recent_tx', 'Recent Transactions')}</h3>
                    <button
                        onClick={handleExportCSV}
                        disabled={transactions.length === 0}
                        title={t('common.exportCSV', 'Download CSV')}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('wallet.export', 'Export')}</span>
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
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl transition-colors border gap-4 ${
                                    isPending
                                        ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/10'
                                        : isFailed
                                        ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20'
                                        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                        isPending ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                                        isFailed  ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
                                        isIncoming ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-600/20 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-600/20 dark:text-red-400'
                                    }`}>
                                        {isPending ? (
                                            <Clock className="w-6 h-6 animate-pulse" />
                                        ) : isFailed ? (
                                            <XCircle className="w-6 h-6" />
                                        ) : isIncoming ? (
                                            <TrendingUp className="w-6 h-6" />
                                        ) : (
                                            <TrendingDown className="w-6 h-6" />
                                        )}
                                    </div>

                                    {/* Description + Date */}
                                    <div>
                                        <p className="text-slate-900 dark:text-white font-bold text-sm sm:text-base">
                                            {transaction.description || (transaction.type === 'deposit' ? t('wallet.transaction.deposit', 'Wallet Deposit') : t('wallet.transaction.purchase', 'Purchase'))}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {new Date(transaction.date || (transaction as any).createdAt || Date.now()).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Right side: amount + status badge */}
                                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1.5 pl-16 sm:pl-0">
                                    <p className={`font-black text-lg ${
                                        isPending ? 'text-amber-600 dark:text-amber-400' :
                                        isFailed  ? 'text-slate-400 dark:text-slate-500 line-through' :
                                        isIncoming ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                        {isIncoming ? '+' : '-'}€{transaction.amount?.toFixed(2)}
                                    </p>

                                    {/* Status Badge */}
                                    {isPending && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                                            <Clock className="w-3 h-3" />
                                            {t('wallet.status.pending', 'Pending — Admin Review')}
                                        </span>
                                    )}
                                    {isFailed && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                                            <XCircle className="w-3 h-3" />
                                            {t('wallet.status.rejected', 'Rejected')}
                                        </span>
                                    )}
                                    {!isPending && !isFailed && (transaction as any).status === 'completed' && isIncoming && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                                            <CheckCircle className="w-3 h-3" />
                                            {t('wallet.status.approved', 'Approved')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {transactions.length === 0 && (
                        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                            <Wallet className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                            <p className="font-medium text-slate-600 dark:text-slate-400">{t('wallet.list.empty', 'No transactions yet')}</p>
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

