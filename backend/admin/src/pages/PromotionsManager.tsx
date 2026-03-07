import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, CheckCircle, AlertCircle, Zap, Save, Power } from 'lucide-react';
import { api } from '../utils/api';

interface Promotion {
    _id: string;
    title: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    minOrderAmount: number;
    createdAt: string;
}

const EMPTY_FORM: Omit<Promotion, '_id' | 'createdAt'> = {
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    startDate: '',
    endDate: '',
    isActive: true,
    minOrderAmount: 0
};

export default function PromotionsManager() {
    const [promos, setPromos] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchPromos = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/promotions');
            const data = (res as any)?.data || res;
            setPromos(Array.isArray(data) ? data : data.promotions || []);
        } catch {
            showToast('error', 'Failed to load promotions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPromos(); }, []);

    const openCreate = () => {
        setEditId(null);
        setForm({ ...EMPTY_FORM });
        setShowModal(true);
    };

    const openEdit = (p: Promotion) => {
        setEditId(p._id);
        setForm({
            title: p.title,
            description: p.description,
            discountType: p.discountType,
            discountValue: p.discountValue,
            startDate: p.startDate?.slice(0, 10) || '',
            endDate: p.endDate?.slice(0, 10) || '',
            isActive: p.isActive,
            minOrderAmount: p.minOrderAmount || 0
        });
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editId) {
                await api.put(`/api/promotions/${editId}`, form);
                showToast('success', 'Promotion updated');
            } else {
                await api.post('/api/promotions', form);
                showToast('success', 'Promotion created');
            }
            setShowModal(false);
            fetchPromos();
        } catch {
            showToast('error', 'Failed to save promotion');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this promotion?')) return;
        try {
            await api.delete(`/api/promotions/${id}`);
            setPromos(prev => prev.filter(p => p._id !== id));
            showToast('success', 'Promotion deleted');
        } catch {
            showToast('error', 'Failed to delete');
        }
    };

    const handleToggle = async (p: Promotion) => {
        try {
            await api.put(`/api/promotions/${p._id}`, { ...p, isActive: !p.isActive });
            setPromos(prev => prev.map(x => x._id === p._id ? { ...x, isActive: !x.isActive } : x));
            showToast('success', p.isActive ? 'Promotion paused' : 'Promotion activated');
        } catch {
            showToast('error', 'Failed to toggle promotion');
        }
    };

    const now = new Date();
    const active = promos.filter(p => p.isActive && new Date(p.endDate) > now);
    const expired = promos.filter(p => !p.isActive || new Date(p.endDate) <= now);

    return (
        <div className="p-6 space-y-8">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-right-4 ${toast.type === 'success'
                    ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-900/90 border-red-500/50 text-red-300'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {toast.text}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Zap className="text-amber-400" size={28} />
                        Promotions Manager
                    </h1>
                    <p className="text-slate-400 mt-1">Create and manage site-wide discount promotions</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all"
                >
                    <Plus size={18} /> New Promotion
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                    <div className="text-2xl font-black text-white">{promos.length}</div>
                    <div className="text-slate-400 text-sm mt-1">Total Promotions</div>
                </div>
                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-5">
                    <div className="text-2xl font-black text-emerald-400">{active.length}</div>
                    <div className="text-emerald-500/70 text-sm mt-1">Active Now</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                    <div className="text-2xl font-black text-slate-500">{expired.length}</div>
                    <div className="text-slate-500 text-sm mt-1">Inactive/Expired</div>
                </div>
            </div>

            {/* Promotions List */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">
                    <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                    Loading promotions...
                </div>
            ) : promos.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl">
                    <Zap size={40} className="mx-auto mb-4 text-slate-700" />
                    <h3 className="text-xl font-bold text-white mb-2">No Promotions Yet</h3>
                    <p className="text-slate-400 mb-6">Create your first promotion to boost sales</p>
                    <button onClick={openCreate} className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all">
                        <Plus className="inline mr-2" size={16} /> Create Promotion
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {promos.map(p => {
                        const isExpired = new Date(p.endDate) <= now;
                        const daysLeft = Math.ceil((new Date(p.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return (
                            <div key={p._id} className={`border rounded-2xl p-5 transition-all ${p.isActive && !isExpired
                                ? 'bg-slate-900/60 border-blue-500/30'
                                : 'bg-slate-900/30 border-slate-800 opacity-60'
                                }`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-black text-white">{p.title}</h3>
                                            {isExpired
                                                ? <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">Expired</span>
                                                : p.isActive
                                                    ? <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">Active</span>
                                                    : <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-400 rounded-full">Paused</span>
                                            }
                                        </div>
                                        <p className="text-slate-400 text-sm">{p.description}</p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <div className="text-2xl font-black text-amber-400">
                                            {p.discountType === 'percentage' ? `${p.discountValue}%` : `€${p.discountValue}`}
                                        </div>
                                        <div className="text-xs text-slate-500">{p.discountType}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 border-t border-slate-800 pt-3">
                                    <span>📅 {new Date(p.startDate).toLocaleDateString()} → {new Date(p.endDate).toLocaleDateString()}</span>
                                    {!isExpired && p.isActive && <span className="text-emerald-400">{daysLeft}d left</span>}
                                    {p.minOrderAmount > 0 && <span>Min: €{p.minOrderAmount}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleToggle(p)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${p.isActive ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                        }`}>
                                        <Power size={12} /> {p.isActive ? 'Pause' : 'Activate'}
                                    </button>
                                    <button onClick={() => openEdit(p)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors">
                                        <Edit2 size={12} /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(p._id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-colors ml-auto">
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-white">{editId ? 'Edit Promotion' : 'New Promotion'}</h3>
                            <button onClick={() => setShowModal(false)} aria-label="Close modal" className="text-slate-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="promo-title" className="block text-xs font-bold text-slate-400 mb-1">Title *</label>
                                <input id="promo-title" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                                    placeholder="Summer Sale 2025" />
                            </div>
                            <div>
                                <label htmlFor="promo-description" className="block text-xs font-bold text-slate-400 mb-1">Description</label>
                                <input id="promo-description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                                    placeholder="Description for this promotion" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="promo-discount-type" className="block text-xs font-bold text-slate-400 mb-1">Discount Type</label>
                                    <select id="promo-discount-type" value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'percentage' | 'fixed' }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm">
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (€)</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="promo-discount-value" className="block text-xs font-bold text-slate-400 mb-1">Value *</label>
                                    <input id="promo-discount-value" required type="number" min={0} value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                                        placeholder={form.discountType === 'percentage' ? '10' : '5.00'} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="promo-start-date" className="block text-xs font-bold text-slate-400 mb-1">Start Date *</label>
                                    <input id="promo-start-date" required type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                                        title="Start Date" />
                                </div>
                                <div>
                                    <label htmlFor="promo-end-date" className="block text-xs font-bold text-slate-400 mb-1">End Date *</label>
                                    <input id="promo-end-date" required type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                                        title="End Date" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="promo-min-order" className="block text-xs font-bold text-slate-400 mb-1">Min Order Amount (€)</label>
                                <input id="promo-min-order" type="number" min={0} value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: Number(e.target.value) }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                                    placeholder="0 = no minimum" />
                            </div>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                    className={`w-12 h-6 rounded-full transition-all relative ${form.isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                    aria-pressed={form.isActive}
                                    title={form.isActive ? 'Active' : 'Inactive'}>
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all ${form.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                                <span className="text-sm text-slate-400">Active immediately</span>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-800">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                                    {editId ? 'Save Changes' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
