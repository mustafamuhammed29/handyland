import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Wallet, Edit, Loader2, AlertCircle, FileText, ExternalLink } from 'lucide-react';
import { api } from '../utils/api';

interface Transaction {
    _id: string;
    amount: number;
    type: string;
    status: string;
    paymentMethod: string;
    description: string;
    createdAt: string;
    receiptUrl?: string;
    user: {
        _id: string;
        name: string;
        email: string;
        balance: number;
    };
}

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    balance: number;
}

const WalletManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'approvals' | 'balances'>('approvals');

    // Transactions State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingTx, setLoadingTx] = useState(true);
    const [txFilter, setTxFilter] = useState('pending');

    // Users State
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustNote, setAdjustNote] = useState('');
    const [adjusting, setAdjusting] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        if (activeTab === 'approvals') {
            fetchTransactions();
        } else {
            fetchUsers();
        }
    }, [activeTab, txFilter]);

    // ----------------------
    // Transactions Tab
    // ----------------------
    const fetchTransactions = async () => {
        setLoadingTx(true);
        try {
            let query = '?type=deposit';
            if (txFilter !== 'all') query += `&status=${txFilter}`;
            const response = await api.get(`/api/transactions/admin${query}`);
            const data = (response as any)?.data || response;
            if (data.success) setTransactions(data.transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoadingTx(false);
        }
    };

    const updateTxStatus = async (id: string, newStatus: string) => {
        if (!window.confirm(`Mark this transaction as ${newStatus}?`)) return;
        try {
            const response = await api.put(`/api/transactions/admin/${id}/status`, { status: newStatus });
            const data = (response as any)?.data || response;
            if (data.success) {
                fetchTransactions();
                showToast('success', `Transaction marked as ${newStatus}`);
            } else {
                showToast('error', data.message || 'Update failed');
            }
        } catch (error) {
            showToast('error', 'Failed to update transaction status.');
        }
    };

    // ----------------------
    // User Balances Tab
    // ----------------------
    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await api.get(`/api/users/admin/all?limit=50&search=${searchQuery}`);
            const data = (response as any)?.data || response;
            if (data.success) setUsers(data.users);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    // Trigger search on Enter
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            fetchUsers();
        }
    };

    const handleAdjustBalance = async () => {
        if (!selectedUser || !adjustAmount || isNaN(parseFloat(adjustAmount))) {
            showToast('error', 'Please enter a valid amount.');
            return;
        }
        setAdjusting(true);
        try {
            const response = await api.post(`/api/users/admin/${selectedUser._id}/wallet`, {
                amount: parseFloat(adjustAmount),
                note: adjustNote
            });
            const data = (response as any)?.data || response;
            if (data.success) {
                showToast('success', `Balance updated! New balance: €${data.newBalance}`);
                setSelectedUser(null);
                setAdjustAmount('');
                setAdjustNote('');
                fetchUsers();
            } else {
                showToast('error', data.message || 'Update failed');
            }
        } catch (error) {
            showToast('error', 'Failed to adjust balance.');
        } finally {
            setAdjusting(false);
        }
    };


    return (
        <div className="p-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-right-4 ${toast.type === 'success'
                        ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-300'
                        : 'bg-red-900/90 border-red-500/50 text-red-300'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {toast.text}
                </div>
            )}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-2">
                        <Wallet className="w-8 h-8 text-blue-500" /> Wallet Manager
                    </h1>
                    <p className="text-slate-400">Manage user balances and approve bank transfers</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 mb-6">
                <button
                    onClick={() => setActiveTab('approvals')}
                    className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'approvals' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                >
                    Top-up Approvals
                </button>
                <button
                    onClick={() => setActiveTab('balances')}
                    className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'balances' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                >
                    Manual Balances
                </button>
            </div>

            {/* Tab 1: Approvals */}
            {activeTab === 'approvals' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                        <h2 className="font-bold text-white">Deposit Transactions</h2>
                        <select
                            value={txFilter}
                            onChange={(e) => setTxFilter(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white p-2 rounded-lg outline-none focus:border-blue-500"
                            aria-label="Filter Transactions by Status"
                            title="Filter Transactions by Status"
                        >
                            <option value="pending">Pending Only</option>
                            <option value="completed">Completed Only</option>
                            <option value="all">All Deposits</option>
                        </select>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 text-sm">
                                        <th className="px-6 py-4 text-left">Date</th>
                                        <th className="px-6 py-4 text-left">User</th>
                                        <th className="px-6 py-4 text-left">Method</th>
                                        <th className="px-6 py-4 text-left">Amount</th>
                                        <th className="px-6 py-4 text-left">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingTx ? (
                                        <tr><td colSpan={6} className="text-center py-8 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                                    ) : transactions.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-8 text-slate-400">No transactions found.</td></tr>
                                    ) : (
                                        transactions.map((tx) => (
                                            <tr key={tx._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 text-slate-300 text-sm">
                                                    {new Date(tx.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-white font-medium">{tx.user?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-slate-500">{tx.user?.email}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-300 uppercase text-xs font-bold tracking-wider">
                                                    {tx.paymentMethod.replace('_', ' ')}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-emerald-400">
                                                    +€{tx.amount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {tx.receiptUrl ? (
                                                        <a
                                                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${tx.receiptUrl}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
                                                            title="View Receipt"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            <span>View</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-600 text-xs italic">No receipt</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${tx.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        tx.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                                            'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {tx.status === 'pending' && (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => updateTxStatus(tx._id, 'completed')}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 rounded-lg transition-colors text-sm font-medium"
                                                                title="Approve & Credit Balance"
                                                            >
                                                                <CheckCircle className="w-4 h-4" /> Approve
                                                            </button>
                                                            <button
                                                                onClick={() => updateTxStatus(tx._id, 'failed')}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded-lg transition-colors text-sm font-medium"
                                                                title="Decline"
                                                            >
                                                                <XCircle className="w-4 h-4" /> Decline
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Manual Balances */}
            {activeTab === 'balances' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name or email... (Press Enter)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <button onClick={fetchUsers} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                            Search
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loadingUsers ? (
                            <div className="col-span-full py-8 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
                        ) : users.length === 0 ? (
                            <div className="col-span-full py-8 text-center text-slate-400">No users found. Try searching.</div>
                        ) : (
                            users.filter(u => u.role !== 'admin').map(user => (
                                <div key={user._id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-white font-bold">{user.name}</h3>
                                            <p className="text-sm text-slate-400">{user.email}</p>
                                        </div>
                                        <div className="bg-blue-900/30 px-3 py-1 rounded-full text-blue-400 font-bold tracking-wider text-sm">
                                            €{(user.balance || 0).toFixed(2)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedUser(user)}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium text-sm"
                                    >
                                        <Edit className="w-4 h-4" /> Adjust Balance
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Adjustment Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Adjust Wallet Balance</h3>
                            <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white" aria-label="Close modal" title="Close Modal"><XCircle /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Editing User:</p>
                                <p className="text-white font-medium">{selectedUser.name} <span className="text-slate-500">({selectedUser.email})</span></p>
                                <p className="text-sm text-blue-400 font-bold mt-1">Current Balance: €{(selectedUser.balance || 0).toFixed(2)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Adjustment Amount (€)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-bold">€</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="e.g. 50 or -10"
                                        value={adjustAmount}
                                        onChange={(e) => setAdjustAmount(e.target.value)}
                                        className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-lg font-mono"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Use negative values to deduct (e.g., -10)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Internal Note (Reason)</label>
                                <textarea
                                    value={adjustNote}
                                    onChange={(e) => setAdjustNote(e.target.value)}
                                    placeholder="e.g. Compensation for order issue"
                                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 resize-none h-24"
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3">
                            <button onClick={() => setSelectedUser(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleAdjustBalance}
                                disabled={adjusting || !adjustAmount}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                {adjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Confirm Adjustment
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default WalletManager;
