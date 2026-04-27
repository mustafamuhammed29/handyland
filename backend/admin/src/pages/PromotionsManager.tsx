import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Zap, Save, Power, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../utils/api';
import useDebounce from '../hooks/useDebounce';
import toast from 'react-hot-toast';

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

    // Pagination & Search
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchPromos = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(debouncedSearch && { search: debouncedSearch })
            });
            const res = await api.get(`/api/promotions?${queryParams.toString()}`);
            const data = res.data;
            if (data.promotions) {
                setPromos(data.promotions);
                setTotalPages(data.totalPages || 1);
                setTotalItems(data.count || 0);
            } else if (Array.isArray(data)) {
                // Fallback
                setPromos(data);
                setTotalPages(1);
                setTotalItems(data.length);
            }
        } catch {
            toast.error('Failed to load promotions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromos();
    }, [page, limit, debouncedSearch]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

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
                toast.success('Promotion updated');
            } else {
                await api.post('/api/promotions', form);
                toast.success('Promotion created');
            }
            setShowModal(false);
            fetchPromos();
        } catch {
            toast.error('Failed to save promotion');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this promotion?')) return;
        try {
            await api.delete(`/api/promotions/${id}`);
            toast.success('Promotion deleted');
            fetchPromos();
        } catch {
            toast.error('Failed to delete promotion');
        }
    };

    const handleToggle = async (p: Promotion) => {
        try {
            await api.put(`/api/promotions/${p._id}`, { ...p, isActive: !p.isActive });
            setPromos(prev => prev.map(x => x._id === p._id ? { ...x, isActive: !x.isActive } : x));
            toast.success(p.isActive ? 'Promotion paused' : 'Promotion activated');
        } catch {
            toast.error('Failed to toggle promotion');
        }
    };

    const now = new Date();

    return (
        <div className="p-6 max-w-[1600px] mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
                        <div className="p-2 bg-amber-500/20 rounded-xl">
                            <Zap className="w-7 h-7 text-amber-400" />
                        </div>
                        Promotions Manager
                    </h1>
                    <p className="text-slate-400 mt-2">Create and manage site-wide discount promotions</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 text-sm"
                >
                    <Plus size={18} /> New Promotion
                </button>
            </div>

            {/* Smart Toolbar */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search promotions by title..."
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2 flex items-center gap-3">
                        <div className="text-2xl font-black text-white">{totalItems}</div>
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total</div>
                    </div>
                </div>
            </div>

            {/* Promotions List */}
            {loading ? (
                <div className="text-center py-16">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <div className="text-blue-400 font-medium">Loading promotions...</div>
                </div>
            ) : promos.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md">
                    <Zap size={48} className="mx-auto mb-5 text-slate-700" />
                    <h3 className="text-2xl font-bold text-white mb-2">No Promotions Found</h3>
                    <p className="text-slate-400 mb-6">Start offering discounts to boost sales.</p>
                    <button onClick={openCreate} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all inline-flex items-center gap-2">
                        <Plus size={18} /> Create First Promotion
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {promos.map(p => {
                            const isExpired = new Date(p.endDate) <= now;
                            const daysLeft = Math.ceil((new Date(p.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            return (
                                <div key={p._id} className={`bg-slate-900/40 border rounded-2xl p-6 backdrop-blur-xl transition-all shadow-xl group hover:shadow-2xl ${p.isActive && !isExpired
                                    ? 'border-blue-500/30 hover:border-blue-500/60'
                                    : 'border-slate-800 opacity-70 hover:opacity-100'
                                    }`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <h3 className="font-bold text-lg text-white truncate max-w-[200px]" title={p.title}>{p.title}</h3>
                                                {isExpired
                                                    ? <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">Expired</span>
                                                    : p.isActive
                                                        ? <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">Active</span>
                                                        : <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">Paused</span>
                                                }
                                            </div>
                                            <p className="text-slate-400 text-sm line-clamp-2 min-h-[40px]">{p.description}</p>
                                        </div>
                                        <div className="text-right ml-4 shrink-0 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                                            <div className="text-2xl font-black text-amber-400">
                                                {p.discountType === 'percentage' ? `${p.discountValue}%` : `€${p.discountValue}`}
                                            </div>
                                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Discount</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-5 bg-slate-950/30 p-3 rounded-lg border border-slate-800/50">
                                        <div className="flex items-center gap-2">
                                            <span>{new Date(p.startDate).toLocaleDateString()}</span>
                                            <span>→</span>
                                            <span className={isExpired ? 'text-red-400' : 'text-white'}>{new Date(p.endDate).toLocaleDateString()}</span>
                                        </div>
                                        {!isExpired && p.isActive && (
                                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">{daysLeft}d left</span>
                                        )}
                                    </div>
                                    {p.minOrderAmount > 0 && (
                                        <div className="text-xs text-slate-400 mb-5 font-medium">
                                            Minimum Order: <span className="text-white font-bold">€{p.minOrderAmount}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 pt-4 border-t border-slate-800/80">
                                        <button onClick={() => handleToggle(p)} className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-xl text-sm font-bold border transition-colors ${p.isActive ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                                            }`}>
                                            <Power size={14} /> {p.isActive ? 'Pause' : 'Activate'}
                                        </button>
                                        <button onClick={() => openEdit(p)} className="p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-colors" title="Edit">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(p._id)} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-xl transition-colors" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-md gap-4 mt-6">
                            <div className="text-sm font-medium text-slate-400">
                                Showing <span className="text-white font-bold">{(page - 1) * limit + 1}</span> to <span className="text-white font-bold">{Math.min(page * limit, totalItems)}</span> of <span className="text-white font-bold">{totalItems}</span> promotions
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
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl relative animate-in zoom-in-95">
                        <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-xl"><Zap className="w-5 h-5 text-blue-400" /></div>
                                {editId ? 'Edit Promotion' : 'New Promotion'}
                            </h3>
                            <button onClick={() => setShowModal(false)} aria-label="Close modal" className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
                            <div>
                                <label htmlFor="promo-title" className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Promotion Title <span className="text-red-500">*</span></label>
                                <input id="promo-title" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="e.g. Summer Mega Sale 2025" />
                            </div>
                            <div>
                                <label htmlFor="promo-description" className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Description</label>
                                <textarea id="promo-description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none h-24"
                                    placeholder="Brief description of the promotion terms..." />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="promo-discount-type" className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Discount Type</label>
                                    <select id="promo-discount-type" value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'percentage' | 'fixed' }))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none">
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (€)</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="promo-discount-value" className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Value <span className="text-red-500">*</span></label>
                                    <input id="promo-discount-value" required type="number" min={0} step={form.discountType === 'percentage' ? "1" : "0.01"} value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-amber-400 font-bold focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder={form.discountType === 'percentage' ? '10' : '5.00'} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="promo-start-date" className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Start Date <span className="text-red-500">*</span></label>
                                    <input id="promo-start-date" required type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                                        title="Start Date" />
                                </div>
                                <div>
                                    <label htmlFor="promo-end-date" className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">End Date <span className="text-red-500">*</span></label>
                                    <input id="promo-end-date" required type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                                        title="End Date" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="promo-min-order" className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Min Order Amount (€)</label>
                                <input id="promo-min-order" type="number" min={0} step="0.01" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: Number(e.target.value) }))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="0.00 (No minimum)" />
                            </div>
                            <div className="flex items-center gap-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                                <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                                    className={`w-12 h-6 rounded-full transition-all relative shadow-inner ${form.isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                    aria-pressed={form.isActive === true}
                                    title={form.isActive ? 'Active' : 'Inactive'}>
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-md ${form.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                                <div>
                                    <div className="text-sm font-bold text-white">Active Promotion</div>
                                    <div className="text-xs text-slate-500">Enable this promotion immediately</div>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-800">
                                <button type="submit" disabled={saving}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                                    {editId ? 'Save Changes' : 'Create Promotion'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
