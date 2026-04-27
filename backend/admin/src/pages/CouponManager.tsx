import React, { useState, useEffect } from 'react';
import {
    Tag,
    Plus,
    Trash2,
    CheckCircle,
    XCircle,
    Power,
    User,
    Search,
    ChevronLeft,
    ChevronRight,
    X,
    Scissors,
    Save
} from 'lucide-react';
import { api } from '../utils/api';
import useDebounce from '../hooks/useDebounce';
import toast from 'react-hot-toast';

interface Coupon {
    _id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    amount?: number;
    minOrderAmount?: number;
    minOrderValue?: number;
    maxDiscount?: number;
    validFrom: string;
    validUntil: string;
    usageLimit: number | null;
    usedCount: number;
    isActive: boolean;
    usedBy?: Array<{
        user?: { _id: string, name: string, email: string };
        email?: string;
        usedAt: string;
    }>;
}

export default function CouponManager() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [expandedCouponId, setExpandedCouponId] = useState<string | null>(null);

    // Pagination & Search
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [page, setPage] = useState(1);
    const [limit] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage',
        amount: 0,
        minOrderAmount: 0,
        expiryDate: '',
        usageLimit: null as number | null
    });

    useEffect(() => {
        fetchCoupons();
    }, [page, limit, debouncedSearch]);

    // Reset to page 1 on search
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(debouncedSearch && { search: debouncedSearch })
            });
            const response = await api.get(`/api/coupons?${queryParams.toString()}`);
            const data = response.data;
            if (data.coupons) {
                setCoupons(data.coupons);
                setTotalPages(data.totalPages || 1);
                setTotalItems(data.count || 0);
            } else if (Array.isArray(data)) {
                // Fallback if backend isn't updated
                setCoupons(data);
                setTotalPages(1);
                setTotalItems(data.length);
            }
        } catch (error) {
            console.error('Error fetching coupons:', error);
            toast.error('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/api/coupons', formData);
            setShowForm(false);
            setFormData({
                code: '',
                discountType: 'percentage',
                amount: 0,
                minOrderAmount: 0,
                expiryDate: '',
                usageLimit: null
            });
            toast.success('Coupon created successfully!');
            fetchCoupons();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error creating coupon');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await api.delete(`/api/coupons/${id}`);
            toast.success('Coupon deleted successfully');
            fetchCoupons();
        } catch (error) {
            console.error('Error deleting coupon:', error);
            toast.error('Failed to delete coupon');
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            const res = await api.patch(`/api/coupons/${id}/toggle`);
            toast.success(res.data.message || 'Status updated');
            setCoupons(coupons.map(c => c._id === id ? { ...c, isActive: !c.isActive } : c));
        } catch (error) {
            console.error('Error toggling coupon status:', error);
            toast.error('Failed to toggle coupon status');
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
                        <div className="p-2 bg-emerald-500/20 rounded-xl">
                            <Scissors className="w-7 h-7 text-emerald-400" />
                        </div>
                        Promotional Coupons
                    </h1>
                    <p className="text-slate-400 mt-2">Create and manage discount codes for marketing campaigns.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 text-sm"
                >
                    <Plus size={18} /> New Coupon
                </button>
            </div>

            {/* Smart Toolbar */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl mb-6 shadow-sm">
                <div className="relative max-w-md">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by coupon code..."
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl relative">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900/90 border-b border-slate-700/80 text-slate-300 text-[13px] uppercase tracking-wider font-bold">
                            <tr>
                                <th className="p-5 pl-6">Coupon Code</th>
                                <th className="p-5">Discount</th>
                                <th className="p-5">Min Order</th>
                                <th className="p-5">Usage limit</th>
                                <th className="p-5">Expires</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-emerald-400">
                                            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="font-medium text-sm">Loading coupons...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-16 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Tag className="w-10 h-10 opacity-30 text-emerald-400" />
                                            <span className="font-medium">No coupons found.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <React.Fragment key={coupon._id}>
                                        <tr className={`transition-all duration-200 hover:bg-slate-800/40 group ${expandedCouponId === coupon._id ? 'bg-slate-800/30' : ''}`}>
                                            <td className="p-5 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg font-mono font-bold text-sm tracking-widest shadow-inner">
                                                        {coupon.code}
                                                    </span>
                                                    {coupon.usedBy && coupon.usedBy.length > 0 && (
                                                        <button
                                                            onClick={() => setExpandedCouponId(expandedCouponId === coupon._id ? null : coupon._id)}
                                                            className="text-[10px] uppercase font-bold bg-slate-800 text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-700 transition-colors"
                                                        >
                                                            {expandedCouponId === coupon._id ? 'Hide Uses' : `View Uses (${coupon.usedCount})`}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5 text-white font-bold text-lg">
                                                {coupon.discountType === 'percentage' 
                                                    ? `${(coupon.discountValue || coupon.amount || 0)}%` 
                                                    : `€${(coupon.discountValue || coupon.amount || 0)}`
                                                }
                                            </td>
                                            <td className="p-5 text-slate-300 font-medium text-sm">
                                                €{(coupon.minOrderValue || coupon.minOrderAmount || 0).toFixed(2)}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <span className="text-white font-bold">{coupon.usedCount || 0}</span>
                                                    <span className="text-slate-500">/</span>
                                                    <span className="text-slate-400">{coupon.usageLimit ? coupon.usageLimit : '∞'}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-300">{new Date(coupon.validUntil).toLocaleDateString()}</span>
                                                    {new Date(coupon.validUntil) < new Date() && (
                                                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Expired</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                {coupon.isActive && new Date(coupon.validUntil) > new Date() ? (
                                                    <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase bg-emerald-500/10 px-2 py-1 rounded w-fit border border-emerald-500/20">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold uppercase bg-red-500/10 px-2 py-1 rounded w-fit border border-red-500/20">
                                                        <XCircle className="w-3.5 h-3.5" /> {coupon.isActive ? 'Expired' : 'Inactive'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-5 pr-6">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleToggleStatus(coupon._id)}
                                                        className={`p-2 rounded-lg transition-colors flex items-center justify-center border ${coupon.isActive
                                                            ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white border-amber-500/30'
                                                            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border-emerald-500/30'
                                                            }`}
                                                        title={coupon.isActive ? "Disable Coupon" : "Enable Coupon"}
                                                    >
                                                        <Power className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(coupon._id)}
                                                        className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded-lg transition-colors"
                                                        title="Delete Coupon"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expanded Row for Usage History */}
                                        {expandedCouponId === coupon._id && coupon.usedBy && coupon.usedBy.length > 0 && (
                                            <tr className="bg-slate-900/50">
                                                <td colSpan={7} className="p-6 border-t border-slate-800/50">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                                                        <User className="w-4 h-4" /> Usage History
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                        {coupon.usedBy.map((usage, idx) => (
                                                            <div key={idx} className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-1 shadow-inner">
                                                                <div className="text-sm font-bold text-white truncate">
                                                                    {usage.user ? usage.user.name : 'Guest User'}
                                                                </div>
                                                                <div className="text-xs text-blue-400/80 truncate">
                                                                    {usage.email || (usage.user ? usage.user.email : 'No email')}
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 mt-1 font-medium">
                                                                    {new Date(usage.usedAt).toLocaleString()}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-900/60 border-t border-slate-800 backdrop-blur-md gap-4">
                        <div className="text-sm font-medium text-slate-400">
                            Showing <span className="text-white font-bold">{(page - 1) * limit + 1}</span> to <span className="text-white font-bold">{Math.min(page * limit, totalItems)}</span> of <span className="text-white font-bold">{totalItems}</span> coupons
                        </div>
                        <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
                            <button
                                aria-label="Previous Page"
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="px-4 py-1 text-sm font-bold text-slate-200">
                                Page {page} of {totalPages}
                            </div>
                            <button
                                aria-label="Next Page"
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Coupon Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95">
                        <button
                            aria-label="Close Modal"
                            onClick={() => setShowForm(false)}
                            className="absolute top-6 right-6 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="p-8 border-b border-slate-800">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-xl"><Tag className="w-5 h-5 text-emerald-400" /></div>
                                Create New Coupon
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Coupon Code <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white uppercase focus:border-emerald-500 outline-none transition-colors"
                                        placeholder="e.g. SUMMER24"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Discount Type</label>
                                    <div className="relative">
                                        <select
                                            title="Discount Type"
                                            value={formData.discountType}
                                            onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white appearance-none focus:border-emerald-500 outline-none transition-colors"
                                        >
                                            <option value="percentage">Percentage Discount (%)</option>
                                            <option value="fixed">Fixed Amount (€)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                        Discount Value {formData.discountType === 'percentage' ? '(%)' : '(€)'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        title="Discount Value"
                                        required
                                        min="0"
                                        step={formData.discountType === 'percentage' ? "1" : "0.01"}
                                        max={formData.discountType === 'percentage' ? "100" : undefined}
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-emerald-400 font-bold focus:border-emerald-500 outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Min. Order Value (€)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.minOrderAmount}
                                        onChange={e => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) })}
                                        placeholder="0.00 (No minimum)"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-emerald-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Expiry Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="datetime-local"
                                        title="Expiry Date"
                                        required
                                        value={formData.expiryDate}
                                        onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-emerald-500 outline-none transition-colors [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Usage Limit (Global)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.usageLimit || ''}
                                        onChange={e => setFormData({ ...formData, usageLimit: e.target.value ? parseInt(e.target.value) : null })}
                                        placeholder="Leave blank for unlimited"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-emerald-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-800">
                                <button
                                    type="submit"
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all"
                                >
                                    <Save size={20} /> Create Coupon Code
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
