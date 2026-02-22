import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Truck, Loader2, Save, X, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

interface ShippingMethod {
    _id: string;
    name: string;
    description: string;
    price: number;
    duration: string;
    isExpress: boolean;
    isActive: boolean;
}

export default function ShippingManager() {
    const [methods, setMethods] = useState<ShippingMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
    const [formData, setFormData] = useState<Partial<ShippingMethod>>({
        name: '',
        description: '',
        price: 0,
        duration: '',
        isExpress: false,
        isActive: true
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchMethods();
    }, []);

    const fetchMethods = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/shipping-methods/admin/all');
            setMethods((res.data || res) as any);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch shipping methods:', err);
            setError('Failed to load shipping methods.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (method?: ShippingMethod) => {
        if (method) {
            setEditingMethod(method);
            setFormData({ ...method });
        } else {
            setEditingMethod(null);
            setFormData({
                name: '',
                description: '',
                price: 0,
                duration: '',
                isExpress: false,
                isActive: true
            });
        }
        setIsModalOpen(true);
        setError(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMethod(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            if (editingMethod) {
                await api.put(`/api/shipping-methods/${editingMethod._id}`, formData);
            } else {
                await api.post('/api/shipping-methods', formData);
            }
            await fetchMethods();
            handleCloseModal();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save shipping method.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this shipping method?')) return;

        try {
            setLoading(true);
            await api.delete(`/api/shipping-methods/${id}`);
            await fetchMethods();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete shipping method.');
            setLoading(false);
        }
    };

    const toggleStatus = async (method: ShippingMethod) => {
        try {
            await api.put(`/api/shipping-methods/${method._id}`, { ...method, isActive: !method.isActive });
            setMethods(methods.map(m => m._id === method._id ? { ...m, isActive: !m.isActive } : m));
        } catch (err) {
            console.error('Failed to toggle status', err);
        }
    };

    if (loading && methods.length === 0) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <Truck className="w-8 h-8 text-blue-500" /> Shipping Methods
                    </h2>
                    <p className="text-slate-400 mt-1">Manage delivery options and pricing</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                >
                    <Plus size={20} /> Add Method
                </button>
            </div>

            {error && !isModalOpen && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> {error}
                </div>
            )}

            <div className="space-y-4">
                {methods.map(method => (
                    <div key={method._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition-colors">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-bold text-white">{method.name}</h3>
                                {method.isExpress && (
                                    <span className="bg-orange-500/20 text-orange-400 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">Express</span>
                                )}
                                {!method.isActive && (
                                    <span className="bg-slate-800 text-slate-400 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">Disabled</span>
                                )}
                            </div>
                            <p className="text-slate-400 text-sm">{method.description}</p>
                            <div className="flex gap-4 mt-3 text-sm text-slate-500 font-medium">
                                <span className="text-blue-400 font-bold">{method.price.toFixed(2)}€</span>
                                <span>•</span>
                                <span>{method.duration}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-auto">
                            <button
                                onClick={() => toggleStatus(method)}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${method.isActive ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                            >
                                {method.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button
                                aria-label="Edit shipping method"
                                onClick={() => handleOpenModal(method)}
                                className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                aria-label="Delete shipping method"
                                onClick={() => handleDelete(method._id)}
                                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {methods.length === 0 && (
                    <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
                        <Truck className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-slate-300">No shipping methods defined</h3>
                        <p className="text-slate-500 mt-2 mb-6">Add your first shipping method to offer delivery to your customers.</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-xl font-bold transition-colors inline-flex items-center gap-2"
                        >
                            <Plus size={18} /> Create Method
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Truck className="w-5 h-5 text-blue-500" />
                                {editingMethod ? 'Edit Shipping Method' : 'Add Shipping Method'}
                            </h3>
                            <button aria-label="Close modal" onClick={handleCloseModal} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {error && (
                            <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" /> {error}
                            </div>
                        )}

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Display Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                                    placeholder="e.g. Standard Delivery"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors min-h-[80px]"
                                    placeholder="e.g. Shipped via DHL standard package"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Price (€)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                                        placeholder="5.99"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Duration</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.duration}
                                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                                        placeholder="e.g. 3-5 Business Days"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-slate-800">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-500 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-bold text-white">Active</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isExpress}
                                        onChange={e => setFormData({ ...formData, isExpress: e.target.checked })}
                                        className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-500 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-bold text-orange-400">Express Method</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-2.5 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {saving ? 'Saving...' : 'Save Method'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
