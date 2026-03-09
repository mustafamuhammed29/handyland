import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Save, Search, Wrench, AlertTriangle } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import { api } from '../utils/api';

export default function RepairPartsManager() {
    const [parts, setParts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        _id: '',
        name: '',
        category: 'Repair Part',
        subCategory: '',
        brand: '',
        price: 0,
        cost: 0,
        stock: 0,
        minStock: 5,
        barcode: '',
        supplier: '',
        image: '',
        description: ''
    });

    const fetchParts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/repair-parts');
            if (res.data?.success) {
                setParts(res.data.data);
            }
        } catch (err) {
            console.error("Failed to load repair parts", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParts();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;
        try {
            await api.delete(`/api/repair-parts/${id}`);
            fetchParts();
        } catch (error) {
            console.error("Failed to delete", error);
            alert("Failed to delete part.");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData._id) {
                await api.put(`/api/repair-parts/${formData._id}`, formData);
            } else {
                const { _id, ...newPartData } = formData;
                await api.post('/api/repair-parts', newPartData);
            }
            setIsModalOpen(false);
            fetchParts();
            setFormData({
                _id: '', name: '', category: 'Repair Part', subCategory: '', brand: '',
                price: 0, cost: 0, stock: 0, minStock: 5, barcode: '', supplier: '', image: '', description: ''
            });
        } catch (error: any) {
            console.error("Error saving part:", error);
            alert(error.response?.data?.message || "Error saving part. Check barcode uniqueness.");
        }
    };

    const handleEdit = (part: any) => {
        setFormData({
            _id: part._id,
            name: part.name || '',
            category: part.category || 'Repair Part',
            subCategory: part.subCategory || '',
            brand: part.brand || '',
            price: part.price || 0,
            cost: part.cost || 0,
            stock: part.stock || 0,
            minStock: part.minStock || 5,
            barcode: part.barcode || '',
            supplier: part.supplier || '',
            image: part.image || '',
            description: part.description || ''
        });
        setIsModalOpen(true);
    };

    const filteredParts = parts.filter(part => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
            (part.name && part.name.toLowerCase().includes(s)) ||
            (part.barcode && part.barcode.toLowerCase().includes(s)) ||
            (part.subCategory && part.subCategory.toLowerCase().includes(s)) ||
            (part.brand && part.brand.toLowerCase().includes(s))
        );
    });

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Repair Parts</h2>
                    <p className="text-slate-400">Manage screens, batteries, charging ports, and more.</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({
                            _id: '', name: '', category: 'Repair Part', subCategory: '', brand: '',
                            price: 0, cost: 0, stock: 0, minStock: 5, barcode: '', supplier: '', image: '', description: ''
                        });
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                >
                    <Plus size={20} /> Add Part
                </button>
            </div>

            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Search by part name, barcode, brand, or category..."
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 pl-12 text-white outline-none focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-950/50 text-slate-400 text-sm border-b border-slate-800">
                            <th className="p-4 pl-6">Part Info</th>
                            <th className="p-4">Barcode</th>
                            <th className="p-4">Supplier</th>
                            <th className="p-4">Cost / Price</th>
                            <th className="p-4">Stock</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading parts...</td></tr>
                        ) : filteredParts.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-500">No repair parts found.</td></tr>
                        ) : filteredParts.map(part => (
                            <tr key={part._id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                                            {part.image ? <img src={part.image} alt={part.name} className="w-full h-full object-cover" /> : <Wrench size={20} />}
                                        </div>
                                        <div>
                                            <div className="text-white font-bold">{part.name}</div>
                                            <div className="text-xs text-slate-500">{part.brand} {part.subCategory && `• ${part.subCategory}`}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 font-mono text-sm text-slate-400">{part.barcode || '-'}</td>
                                <td className="p-4 text-sm text-slate-300">{part.supplier || '-'}</td>
                                <td className="p-4">
                                    <div className="text-sm font-bold text-white">€{part.price?.toFixed(2)}</div>
                                    <div className="text-xs text-slate-500">Cost: €{part.cost?.toFixed(2)}</div>
                                </td>
                                <td className="p-4">
                                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${part.stock > part.minStock ? 'bg-green-500/20 text-green-400' :
                                        part.stock > 0 ? 'bg-orange-500/20 text-orange-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                        {part.stock}
                                        {part.stock <= part.minStock && <AlertTriangle size={12} className="ml-1" />}
                                    </div>
                                </td>
                                <td className="p-4 pr-6">
                                    <div className="flex justify-end gap-2">
                                        <button title="Edit Part" aria-label="Edit Part" onClick={() => handleEdit(part)} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded-lg transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                        <button title="Delete Part" aria-label="Delete Part" onClick={() => handleDelete(part._id, part.name)} className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 z-[100] overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl relative shadow-2xl my-8">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h3 className="text-xl font-bold text-white">{formData._id ? 'Edit Part' : 'Add New Part'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Part Name *</label>
                                        <input required type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. iPhone 13 Pro Screen" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Brand</label>
                                            <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="e.g. Apple" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Sub-Category</label>
                                            <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" value={formData.subCategory} onChange={e => setFormData({ ...formData, subCategory: e.target.value })} placeholder="e.g. Screen, Battery" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Barcode</label>
                                        <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none font-mono" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} placeholder="Scan or type barcode" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Supplier / Vendor</label>
                                        <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} placeholder="e.g. iFixit, MobileSentrix" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Cost Price (€)</label>
                                            <input title="Cost Price" type="number" step="0.01" min="0" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" value={formData.cost} onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Sale Price (€)</label>
                                            <input title="Sale Price" type="number" step="0.01" min="0" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Current Stock</label>
                                            <input title="Current Stock" type="number" min="0" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Min Stock Alert</label>
                                            <input title="Min Stock Alert" type="number" min="0" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Part Image</label>
                                        <ImageUpload value={formData.image} onChange={(url) => setFormData({ ...formData, image: url })} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Description & Notes</label>
                                <textarea rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Any additional notes about this part..."></textarea>
                            </div>

                            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-800">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">
                                    <Save size={20} /> Save Part
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
