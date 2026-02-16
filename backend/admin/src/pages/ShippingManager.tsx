import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X, Edit2, Save, Truck, Clock } from 'lucide-react';
import { api } from '../utils/api';

export default function ShippingManager() {
    const [methods, setMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Shipping Method Form Data
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        price: '',
        duration: '',
        isExpress: false
    });

    const fetchMethods = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/shipping-methods/admin/all');
            setMethods(response.data);
        } catch (err) {
            console.error("Failed to load shipping methods:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMethods();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this shipping method?')) return;
        try {
            await api.delete(`/api/shipping-methods/${id}`);
            fetchMethods();
        } catch (error) {
            console.error("Failed to delete shipping method:", error);
            alert('Failed to delete. Please try again.');
        }
    };

    const handleEdit = (item: any) => {
        setFormData({
            id: item._id,
            name: item.name,
            description: item.description,
            price: item.price,
            duration: item.duration,
            isExpress: item.isExpress
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            id: '', name: '', description: '', price: '', duration: '', isExpress: false
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (formData.id) {
                await api.put(`/api/shipping-methods/${formData.id}`, payload);
            } else {
                await api.post('/api/shipping-methods', payload);
            }
            setIsModalOpen(false);
            resetForm();
            fetchMethods();
        } catch (error) {
            console.error("Failed to save shipping method:", error);
            alert('Failed to save. Please try again.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white">Shipping Manager</h2>
                    <p className="text-slate-400 mt-1">Manage delivery options & settings</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
                >
                    <Plus size={20} /> Add Method
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500" > Loading shipping methods...</div>
            ) : methods.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                    No shipping methods found.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {methods.map((method) => (
                        <div key={method._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative group hover:border-blue-500/50 transition-all">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button title="Edit" aria-label="Edit" onClick={() => handleEdit(method)} className="bg-slate-800/90 hover:bg-blue-600 text-white p-2 rounded-lg"><Edit2 size={16} /></button>
                                <button title="Delete" aria-label="Delete" onClick={() => handleDelete(method._id)} className="bg-slate-800/90 hover:bg-red-600 text-white p-2 rounded-lg"><Trash2 size={16} /></button>
                            </div>

                            <div className="flex items-start gap-3 mb-4">
                                <div className={`p-3 rounded-xl ${method.isExpress ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{method.name}</h3>
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <Clock size={12} /> {method.duration}
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-slate-400 mb-4 h-10 line-clamp-2">{method.description}</p>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                                <div className="text-2xl font-black text-white">€{method.price}</div>
                                {method.isExpress && <span className="text-xs font-bold px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">EXPRESS</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )
            }

            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl relative">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/95 backdrop-blur rounded-t-2xl">
                                <h3 className="text-2xl font-bold text-white">{formData.id ? 'Edit Method' : 'New Method'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800" title="Close" aria-label="Close"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label htmlFor="nameInput" className="block text-xs font-bold text-slate-400 uppercase mb-2">Name</label>
                                    <input id="nameInput" className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Standard Delivery" title="Method Name" />
                                </div>
                                <div>
                                    <label htmlFor="descInput" className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                                    <input id="descInput" className="input-field" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required placeholder="e.g. Reliable delivery via DHL" title="Description" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="priceInput" className="block text-xs font-bold text-slate-400 uppercase mb-2">Price (€)</label>
                                        <input id="priceInput" type="number" className="input-field" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required placeholder="0.00" title="Price" />
                                    </div>
                                    <div>
                                        <label htmlFor="durationInput" className="block text-xs font-bold text-slate-400 uppercase mb-2">Duration</label>
                                        <input id="durationInput" className="input-field" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} required placeholder="e.g. 3-5 Business Days" title="Duration" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                                    <input type="checkbox" id="isExpress" checked={formData.isExpress} onChange={e => setFormData({ ...formData, isExpress: e.target.checked })} className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500" title="Is Express?" />
                                    <label htmlFor="isExpress" className="text-sm font-medium text-white cursor-pointer select-none">Is Express Shipping? (Usually faster & more expensive)</label>
                                </div>

                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-4 shadow-lg shadow-blue-900/20">
                                    <Save size={20} /> Save Method
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
            <style>{`
                .input-field {
                    width: 100%;
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 0.75rem;
                    padding: 0.75rem 1rem;
                    color: white;
                    outline: none;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }
            `}</style>
        </div >
    );
}
