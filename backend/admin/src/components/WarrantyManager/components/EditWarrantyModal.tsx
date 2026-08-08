import React, { useState, useEffect } from 'react';
import { ShieldCheck, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Warranty {
    _id: string;
    warrantyCode: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    itemType: 'Repair' | 'Product' | 'Accessory';
    itemName: string;
    imeiOrSerial: string;
    supplierName: string;
    startDate: string;
    durationDays: number;
    endDate: string;
    status: 'Active' | 'Expired' | 'Claimed' | 'Voided';
    notes: string;
    createdAt: string;
}

interface EditWarrantyModalProps {
    isOpen: boolean;
    onClose: () => void;
    warranty: Warranty | null;
    onSave: (id: string, updateData: Partial<Warranty>) => Promise<void>;
}

export function EditWarrantyModal({ isOpen, onClose, warranty, onSave }: EditWarrantyModalProps) {
    const [formData, setFormData] = useState<Partial<Warranty>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (warranty && isOpen) {
            setFormData({
                customerName: warranty.customerName,
                customerPhone: warranty.customerPhone,
                customerEmail: warranty.customerEmail,
                itemType: warranty.itemType,
                itemName: warranty.itemName,
                imeiOrSerial: warranty.imeiOrSerial,
                supplierName: warranty.supplierName,
                durationDays: warranty.durationDays,
                notes: warranty.notes,
                status: warranty.status
            });
        }
    }, [warranty, isOpen]);

    if (!isOpen || !warranty) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(warranty._id, formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 sticky top-0 z-10">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30">
                            <ShieldCheck size={20} />
                        </div>
                        Edit Warranty: <span className="text-emerald-400 font-mono text-xl">{warranty.warrantyCode}</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="edit-warranty-form" onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Customer Name</label>
                                <input
                                    required
                                    value={formData.customerName || ''}
                                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-white outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Customer Phone</label>
                                <input
                                    required
                                    value={formData.customerPhone || ''}
                                    onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-white outline-none transition-all"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Customer Email (Optional)</label>
                                <input
                                    type="email"
                                    value={formData.customerEmail || ''}
                                    onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-white outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-800 my-4"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Item Type</label>
                                <select
                                    value={formData.itemType || 'Product'}
                                    onChange={e => setFormData({ ...formData, itemType: e.target.value as any })}
                                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-white outline-none transition-all"
                                >
                                    <option value="Repair">Repair (Service/Parts)</option>
                                    <option value="Product">Product (Device)</option>
                                    <option value="Accessory">Accessory</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Item Name</label>
                                <input
                                    required
                                    value={formData.itemName || ''}
                                    onChange={e => setFormData({ ...formData, itemName: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-white outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">IMEI / Serial Number</label>
                                <input
                                    value={formData.imeiOrSerial || ''}
                                    onChange={e => setFormData({ ...formData, imeiOrSerial: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Supplier Name</label>
                                <input
                                    value={formData.supplierName || ''}
                                    onChange={e => setFormData({ ...formData, supplierName: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-white outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-800 my-4"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Duration (Days)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.durationDays || ''}
                                    onChange={e => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-white outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Status</label>
                                <select
                                    value={formData.status || 'Active'}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-white outline-none transition-all"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Claimed">Claimed</option>
                                    <option value="Voided">Voided</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Additional Notes</label>
                                <textarea
                                    value={formData.notes || ''}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-white outline-none transition-all resize-none"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-warranty-form"
                        disabled={isSaving}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        <Save size={18} />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
