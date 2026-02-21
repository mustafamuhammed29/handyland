import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit2, Trash2, Save, X, CheckSquare, Square } from 'lucide-react';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

interface Accessory {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
    inStock: boolean;
}

export const DashboardAccessories: React.FC = () => {
    const [accessories, setAccessories] = useState<Accessory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
    const [currentAccessory, setCurrentAccessory] = useState<Partial<Accessory>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();

    useEffect(() => {
        fetchAccessories();
    }, []);

    const fetchAccessories = async () => {
        try {
            const res = await api.get('/api/accessories');
            setAccessories(res.data || res);
        } catch (error) {
            console.error('Failed to fetch accessories', error);
            addToast('Failed to load accessories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (currentAccessory._id) {
                const res = await api.put(`/api/accessories/${currentAccessory._id}`, currentAccessory);
                const updated = res.data || res;
                setAccessories(prev => prev.map(a => a._id === updated._id ? updated : a));
                addToast('Accessory updated', 'success');
            } else {
                const res = await api.post('/api/accessories', currentAccessory);
                const created = res.data || res;
                setAccessories(prev => [...prev, created]);
                addToast('Accessory created', 'success');
            }
            setIsEditing(false);
            setCurrentAccessory({});
        } catch (error) {
            addToast('Operation failed', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this accessory?')) return;
        try {
            await api.delete(`/api/accessories/${id}`);
            setAccessories(prev => prev.filter(a => a._id !== id));
            addToast('Accessory deleted', 'success');
        } catch (error) {
            addToast('Failed to delete', 'error');
        }
    };

    const handleSelectAll = () => {
        if (selectedAccessories.length === accessories.length && accessories.length > 0) {
            setSelectedAccessories([]);
        } else {
            setSelectedAccessories(accessories.map(a => a._id));
        }
    };

    const toggleSelectAccessory = (id: string) => {
        if (selectedAccessories.includes(id)) {
            setSelectedAccessories(selectedAccessories.filter(aId => aId !== id));
        } else {
            setSelectedAccessories([...selectedAccessories, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedAccessories.length} selected accessories?`)) return;
        try {
            await Promise.all(selectedAccessories.map(id => api.delete(`/api/accessories/${id}`)));
            setAccessories(prev => prev.filter(a => !selectedAccessories.includes(a._id)));
            setSelectedAccessories([]);
            addToast('Accessories deleted', 'success');
        } catch (error) {
            addToast('Failed to perform bulk delete', 'error');
        }
    };

    const filteredAccessories = accessories.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="text-white">Loading accessories...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Package className="w-6 h-6 text-blue-400" />
                    Accessories Manager
                </h2>
                <button
                    onClick={() => {
                        setCurrentAccessory({ inStock: true });
                        setIsEditing(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Accessory
                </button>
            </div>

            {/* Bulk Actions */}
            {selectedAccessories.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-2">
                        <span className="text-blue-400 font-bold">{selectedAccessories.length}</span>
                        <span className="text-slate-300">accessories selected</span>
                    </div>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors font-medium"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Selected
                    </button>
                </div>
            )}

            {/* Controls */}
            <div className="flex gap-4 items-center">
                <button
                    onClick={handleSelectAll}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl flex items-center gap-2 transition-colors border border-slate-700"
                    aria-label={selectedAccessories.length === accessories.length && accessories.length > 0 ? "Deselect All" : "Select All"}
                    title={selectedAccessories.length === accessories.length && accessories.length > 0 ? "Deselect All" : "Select All"}
                >
                    {selectedAccessories.length === accessories.length && accessories.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-blue-500" />
                    ) : (
                        <Square className="w-5 h-5" />
                    )}
                </button>
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search accessories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAccessories.map(acc => (
                    <div key={acc._id} className={`bg-slate-900/50 border ${selectedAccessories.includes(acc._id) ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-800'} rounded-2xl overflow-hidden relative group hover:border-blue-500/50 transition-all`}>
                        <div className="absolute top-4 left-4 z-10">
                            <button
                                onClick={() => toggleSelectAccessory(acc._id)}
                                className="bg-slate-900/80 backdrop-blur-sm p-2 rounded-lg text-slate-400 hover:text-white transition-colors"
                                aria-label={selectedAccessories.includes(acc._id) ? "Deselect Accessory" : "Select Accessory"}
                            >
                                {selectedAccessories.includes(acc._id) ? (
                                    <CheckSquare className="w-5 h-5 text-blue-500" />
                                ) : (
                                    <Square className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <div className="aspect-video relative overflow-hidden bg-slate-800">
                            {acc.image ? (
                                <img
                                    src={acc.image}
                                    alt={acc.name}
                                    onError={(e: any) => { e.target.src = '/images/placeholder.png'; }}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                    <Package className="w-12 h-12" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${acc.inStock ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                    {acc.inStock ? 'In Stock' : 'Out of Stock'}
                                </span>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-white mb-1">{acc.name}</h3>
                                    <p className="text-sm text-slate-400">{acc.category}</p>
                                </div>
                                <span className="text-blue-400 font-bold">€{acc.price}</span>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => {
                                        setCurrentAccessory(acc);
                                        setIsEditing(true);
                                    }}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit2 className="w-4 h-4" /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(acc._id)}
                                    className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                    aria-label="Delete Accessory"
                                    title="Delete Accessory"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">
                                {currentAccessory._id ? 'Edit Accessory' : 'New Accessory'}
                            </h3>
                            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white" aria-label="Close Modal" title="Close Modal">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={currentAccessory.name || ''}
                                    onChange={e => setCurrentAccessory({ ...currentAccessory, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    aria-label="Accessory Name"
                                    placeholder="Enter Name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Price</label>
                                    <input
                                        type="number"
                                        value={currentAccessory.price || ''}
                                        onChange={e => setCurrentAccessory({ ...currentAccessory, price: Number(e.target.value) })}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                        aria-label="Accessory Price"
                                        placeholder="Enter Price"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={currentAccessory.category || ''}
                                        onChange={e => setCurrentAccessory({ ...currentAccessory, category: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                        aria-label="Accessory Category"
                                        placeholder="Enter Category"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                                <textarea
                                    value={currentAccessory.description || ''}
                                    onChange={e => setCurrentAccessory({ ...currentAccessory, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white h-24 resize-none"
                                    aria-label="Accessory Description"
                                    placeholder="Enter Description"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Image URL</label>
                                <input
                                    type="text"
                                    value={currentAccessory.image || ''}
                                    onChange={e => setCurrentAccessory({ ...currentAccessory, image: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                                    aria-label="Accessory Image URL"
                                    placeholder="Enter Image URL"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="inStock"
                                    checked={currentAccessory.inStock || false}
                                    onChange={e => setCurrentAccessory({ ...currentAccessory, inStock: e.target.checked })}
                                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600"
                                />
                                <label htmlFor="inStock" className="text-white">In Stock</label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-800 flex justify-end gap-2">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-800 text-white rounded-lg">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2">
                                <Save className="w-4 h-4" /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
