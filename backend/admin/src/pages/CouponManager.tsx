import React, { useState, useEffect } from 'react';
import {
    Tag,
    Plus,
    Trash2,
    CheckCircle,
    XCircle,
    Power,
    User
} from 'lucide-react';
import { api } from '../utils/api';

interface Coupon {
    _id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    amount?: number; // Depending on backend naming
    minOrderAmount: number;
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
    }, []);

    const fetchCoupons = async () => {
        try {
            const response = await api.get('/api/coupons');
            setCoupons(response.data);
        } catch (error) {
            console.error('Error fetching coupons:', error);
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
            fetchCoupons();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error creating coupon');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await api.delete(`/api/coupons/${id}`);
            fetchCoupons();
        } catch (error) {
            console.error('Error deleting coupon:', error);
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            await api.patch(`/api/coupons/${id}/toggle`);
            fetchCoupons();
        } catch (error) {
            console.error('Error toggling coupon status:', error);
            alert('Failed to toggle coupon status');
        }
    };

    if (loading) return <div className="text-slate-400">Loading coupons...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Tag className="w-6 h-6 text-emerald-500" />
                        Coupon Manager
                    </h2>
                    <p className="text-slate-400 mt-1">Create and manage discount codes. Each account can use a coupon only once.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all"
                >
                    {showForm ? <XCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {showForm ? 'Cancel' : 'New Coupon'}
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold text-white mb-4">Create New Coupon</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Coupon Code</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white uppercase"
                                    placeholder="SUMMER20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Discount Type</label>
                                <select
                                    aria-label="Discount Type"
                                    value={formData.discountType}
                                    onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (€)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Discount Value</label>
                                <input
                                    type="number"
                                    aria-label="Discount Value"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Min Order Target (€)</label>
                                <input
                                    type="number"
                                    aria-label="Min Order Target"
                                    min="0"
                                    step="0.01"
                                    value={formData.minOrderAmount}
                                    onChange={e => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Expiry Date</label>
                                <input
                                    type="datetime-local"
                                    aria-label="Expiry Date"
                                    required
                                    value={formData.expiryDate}
                                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-800">
                            <button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold"
                            >
                                Save Coupon
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-950/50">
                        <tr>
                            <th className="p-4 text-slate-400 font-bold">Code</th>
                            <th className="p-4 text-slate-400 font-bold">Discount</th>
                            <th className="p-4 text-slate-400 font-bold">Min Order</th>
                            <th className="p-4 text-slate-400 font-bold">Expires</th>
                            <th className="p-4 text-slate-400 font-bold">Used</th>
                            <th className="p-4 text-slate-400 font-bold">Status</th>
                            <th className="p-4 text-slate-400 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {coupons.map(coupon => (
                            <React.Fragment key={coupon._id}>
                                <tr className="hover:bg-slate-800/20">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-800 text-white px-2 py-1 rounded font-mono font-bold text-sm tracking-widest">
                                                {coupon.code}
                                            </span>
                                            {coupon.usedBy && coupon.usedBy.length > 0 && (
                                                <button
                                                    onClick={() => setExpandedCouponId(expandedCouponId === coupon._id ? null : coupon._id)}
                                                    className="text-xs bg-slate-800 text-slate-300 hover:text-white px-2 py-1 rounded border border-slate-700"
                                                >
                                                    {expandedCouponId === coupon._id ? 'Hide Uses' : 'View Uses'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-white font-medium">
                                        {(coupon.discountValue || coupon.amount) || 0}
                                        {coupon.discountType === 'percentage' ? '%' : '€'}
                                    </td>
                                    <td className="p-4 text-slate-300">
                                        €{coupon.minOrderAmount?.toFixed(2) || '0.00'}
                                    </td>
                                    <td className="p-4 text-slate-300">
                                        {new Date(coupon.validUntil).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-slate-300">
                                        {coupon.usedCount || 0} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ''}
                                    </td>
                                    <td className="p-4">
                                        {coupon.isActive && new Date(coupon.validUntil) > new Date() ? (
                                            <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold uppercase">
                                                <CheckCircle className="w-3 h-3" /> Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-red-400 text-xs font-bold uppercase">
                                                <XCircle className="w-3 h-3" /> Inactive/Expired
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(coupon._id)}
                                                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${coupon.isActive
                                                    ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white'
                                                    : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                                                    }`}
                                                title={coupon.isActive ? "Disable Coupon" : "Enable Coupon"}
                                            >
                                                <Power className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon._id)}
                                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                                                title="Delete Coupon"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {expandedCouponId === coupon._id && coupon.usedBy && coupon.usedBy.length > 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-0 border-t border-slate-800/50 bg-slate-950/30">
                                            <div className="p-4 bg-slate-900/50">
                                                <h4 className="text-sm font-bold text-slate-400 mb-2 flex items-center gap-1">
                                                    <User className="w-4 h-4" /> Usage History (One per Account)
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {coupon.usedBy.map((usage, idx) => (
                                                        <div key={idx} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex flex-col gap-1">
                                                            <div className="text-sm font-medium text-white">
                                                                {usage.user ? usage.user.name : 'Guest User'}
                                                            </div>
                                                            <div className="text-xs text-slate-400">
                                                                {usage.email || (usage.user ? usage.user.email : 'No email')}
                                                            </div>
                                                            <div className="text-xs text-slate-500 mt-1">
                                                                Used: {new Date(usage.usedAt).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        {coupons.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-500">
                                    No coupons found. Click "New Coupon" to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
