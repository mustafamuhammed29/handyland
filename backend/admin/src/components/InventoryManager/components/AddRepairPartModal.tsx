import React, { useState } from 'react';
import { X, Box, Save } from 'lucide-react';

interface AddRepairPartModalProps {
    isOpen: boolean;
    onClose: () => void;
    handleAddPartSave: (form: any) => Promise<{ success: boolean; error?: string }>;
}

export function AddRepairPartModal({ isOpen, onClose, handleAddPartSave }: AddRepairPartModalProps) {
    const [addPartForm, setAddPartForm] = useState({
        name: '', subCategory: '', brand: '', model: '', price: 0, costPrice: 0, stock: 0, minStock: 5, barcode: '', supplierName: '', supplierContact: '', image: '', description: ''
    });

    if (!isOpen) return null;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await handleAddPartSave(addPartForm);
        if (result.success) {
            setAddPartForm({
                name: '', subCategory: '', brand: '', model: '', price: 0, costPrice: 0, stock: 0, minStock: 5, barcode: '', supplierName: '', supplierContact: '', image: '', description: ''
            });
            alert("Repair Part added successfully!");
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
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                        <Box size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">Add Repair Part</h3>
                        <p className="text-slate-400 text-sm">Fill in the details for the new inventory item.</p>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Form Fields */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Part Name *</label>
                        <input
                            type="text" required placeholder="E.g. iPhone 13 Pro Screen (OLED)"
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                            value={addPartForm.name} onChange={e => setAddPartForm({ ...addPartForm, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sub-Category *</label>
                        <select
                            required
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                            value={addPartForm.subCategory} onChange={e => setAddPartForm({ ...addPartForm, subCategory: e.target.value })}
                            title="Sub-Category"
                            aria-label="Sub-Category"
                        >
                            <option value="">Select Category</option>
                            <option value="Screens">Screens & Displays</option>
                            <option value="Batteries">Batteries</option>
                            <option value="Small Parts">Small Parts (Flex, Cameras, etc)</option>
                            <option value="Housings">Housings & Back Glass</option>
                            <option value="Tools">Repair Tools & Consumables</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand</label>
                            <input
                                type="text" placeholder="E.g. Apple, Samsung"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                value={addPartForm.brand} onChange={e => setAddPartForm({ ...addPartForm, brand: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Model</label>
                            <input
                                type="text" placeholder="E.g. iPhone 13 Pro"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                value={addPartForm.model} onChange={e => setAddPartForm({ ...addPartForm, model: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Barcode / SKU</label>
                        <input
                            type="text" placeholder="Scan or type barcode"
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none focus:bg-slate-900 font-mono transition-all"
                            value={addPartForm.barcode} onChange={e => setAddPartForm({ ...addPartForm, barcode: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier Name</label>
                            <input
                                type="text" placeholder="Supplier name"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                value={addPartForm.supplierName} onChange={e => setAddPartForm({ ...addPartForm, supplierName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier Contact</label>
                            <input
                                type="text" placeholder="Phone, Email, or Link"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                value={addPartForm.supplierContact} onChange={e => setAddPartForm({ ...addPartForm, supplierContact: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cost Price (€) *</label>
                            <input
                                type="number" step="0.01" min="0" required placeholder="e.g. 50"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                value={addPartForm.costPrice === 0 ? '' : addPartForm.costPrice} onChange={e => setAddPartForm({ ...addPartForm, costPrice: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sale Price (€) *</label>
                            <input
                                type="number" step="0.01" min="0" required placeholder="e.g. 100"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                value={addPartForm.price === 0 ? '' : addPartForm.price} onChange={e => setAddPartForm({ ...addPartForm, price: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Initial Stock *</label>
                            <input
                                type="number" min="0" required placeholder="e.g. 10"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                value={addPartForm.stock} onChange={e => setAddPartForm({ ...addPartForm, stock: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock Alert *</label>
                            <input
                                type="number" min="0" required placeholder="e.g. 5"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none border-l-4 border-l-amber-500 transition-all"
                                value={addPartForm.minStock} onChange={e => setAddPartForm({ ...addPartForm, minStock: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Image URL (Optional)</label>
                        <input
                            type="url" placeholder="https://..."
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                            value={addPartForm.image} onChange={e => setAddPartForm({ ...addPartForm, image: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description (Optional)</label>
                        <textarea
                            placeholder="Additional details..."
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none h-24 resize-none transition-all"
                            value={addPartForm.description} onChange={e => setAddPartForm({ ...addPartForm, description: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2 mt-4">
                        <button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
                        >
                            <Save size={20} /> Save Repair Part
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
