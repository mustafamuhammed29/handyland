import React, { useState } from 'react';
import { Wallet, Plus, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { WalletTransaction } from '../../types';

interface DashboardWalletProps {
    balance: number;
    transactions: WalletTransaction[];
    isLoading: boolean;
    onAddFunds: () => void;
}

export const DashboardWallet: React.FC<DashboardWalletProps> = ({
    balance,
    transactions,
    isLoading,
    onAddFunds
}) => {
    const currentMonth = new Date().getMonth();

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-48 bg-slate-800/50 rounded-2xl"></div>
                <div className="h-32 bg-slate-800/50 rounded-2xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
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
                            onClick={onAddFunds}
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
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${transaction.type === 'credit'
                                    ? 'bg-emerald-600/20'
                                    : 'bg-red-600/20'
                                    }`}>
                                    {transaction.type === 'credit' ? (
                                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    ) : (
                                        <TrendingDown className="w-5 h-5 text-red-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{transaction.description}</p>
                                    <p className="text-sm text-slate-400">
                                        {new Date(transaction.date || Date.now()).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <p className={`font-bold ${transaction.type === 'credit' ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                {transaction.type === 'credit' ? '+' : '-'}€{transaction.amount?.toFixed(2)}
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
        </div>
    );
};
