import React, { useState } from 'react';
import { X, Headphones, Save } from 'lucide-react';

interface AddAccessoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    handleAddAccessorySave: (form: any) => Promise<{ success: boolean; error?: string }>;
}

export function AddAccessoryModal({ isOpen, onClose, handleAddAccessorySave }: AddAccessoryModalProps) {
    const [addForm, setAddForm] = useState({
        name: '', category: '', brand: '', model: '', price: 0, costPrice: 0, 
        stock: 0, minStock: 5, barcode: '', supplierName: '', supplierContact: '', 
        image: '', description: ''
    });

    if (!isOpen) return null;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await handleAddAccessorySave(addForm);
        if (result.success) {
            setAddForm({
                name: '', category: '', brand: '', model: '', price: 0, costPrice: 0, 
                stock: 0, minStock: 5, barcode: '', supplierName: '', supplierContact: '', 
                image: '', description: ''
            });
            alert("Accessory added successfully!");
        } else {
            alert(result.error);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto transition-opacity"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 border border-slate-700/50 w-full max-w-2xl rounded-2xl p-6 md:p-8 relative shadow-[0_0_40px_rgba(0,0,0,0.5)] my-8 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-lg transition-colors"
                    title="Close"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
                        <Headphones size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">Add Accessory</h3>
                        <p className="text-slate-400 text-sm">Add a new case, charger, or other accessory.</p>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Form Fields */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accessory Name *</label>
                        <input
                            type="text" required placeholder="E.g. iPhone 15 Pro Clear Case"
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                            value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category *</label>
                        <select
                            required
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                            value={addForm.category} onChange={e => setAddForm({ ...addForm, category: e.target.value })}
                            title="Category"
                            aria-label="Category"
                        >
                            <option value="">Select Category</option>
                            <option value="protection">Cases & Screen Protectors</option>
                            <option value="power">Chargers & Cables</option>
                            <option value="audio">Audio & Headphones</option>
                            <option value="wearables">Smartwatch Bands & Accessories</option>
                            <option value="other">Other Accessories</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand</label>
                            <input
                                type="text" placeholder="E.g. Spigen"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                value={addForm.brand} onChange={e => setAddForm({ ...addForm, brand: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Model</label>
                            <input
                                type="text" placeholder="E.g. Ultra Hybrid"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                value={addForm.model} onChange={e => setAddForm({ ...addForm, model: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Barcode / SKU</label>
                        <input
                            type="text" placeholder="Scan or type barcode"
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none focus:bg-slate-900 font-mono transition-all"
                            value={addForm.barcode} onChange={e => setAddForm({ ...addForm, barcode: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier Name</label>
                            <input
                                type="text" placeholder="Supplier name"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                value={addForm.supplierName} onChange={e => setAddForm({ ...addForm, supplierName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier Contact</label>
                            <input
                                type="text" placeholder="Phone, Email, or Link"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                value={addForm.supplierContact} onChange={e => setAddForm({ ...addForm, supplierContact: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cost Price (€) *</label>
                            <input
                                type="number" step="0.01" min="0" required placeholder="e.g. 10"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                value={addForm.costPrice === 0 ? '' : addForm.costPrice} onChange={e => setAddForm({ ...addForm, costPrice: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sale Price (€) *</label>
                            <input
                                type="number" step="0.01" min="0" required placeholder="e.g. 25"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                value={addForm.price === 0 ? '' : addForm.price} onChange={e => setAddForm({ ...addForm, price: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Initial Stock *</label>
                            <input
                                type="number" min="0" required placeholder="e.g. 20"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                                value={addForm.stock} onChange={e => setAddForm({ ...addForm, stock: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock Alert *</label>
                            <input
                                type="number" min="0" required placeholder="e.g. 5"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none border-l-4 border-l-amber-500 transition-all"
                                value={addForm.minStock} onChange={e => setAddForm({ ...addForm, minStock: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Image URL (Optional)</label>
                        <input
                            type="url" placeholder="https://..."
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                            value={addForm.image} onChange={e => setAddForm({ ...addForm, image: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description (Optional)</label>
                        <textarea
                            placeholder="Additional details..."
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none h-24 resize-none transition-all"
                            value={addForm.description} onChange={e => setAddForm({ ...addForm, description: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2 mt-4">
                        <button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.4)] flex items-center justify-center gap-2"
                        >
                            <Save size={20} /> Save Accessory
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
