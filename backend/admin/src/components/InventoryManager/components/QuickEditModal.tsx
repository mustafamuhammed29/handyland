import React from 'react';
import { X, Save } from 'lucide-react';

interface QuickEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingItem: any;
    editForm: { price: number; costPrice: number; stock: number; reason: string; notes: string };
    setEditForm: (form: any) => void;
    handleUpdateItem: (e: React.FormEvent) => void;
}

export function QuickEditModal({
    isOpen, onClose, editingItem, editForm, setEditForm, handleUpdateItem
}: QuickEditModalProps) {
    if (!isOpen || !editingItem) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 border border-slate-700/50 w-full max-w-sm rounded-2xl p-6 relative shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200"
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

                <h3 className="text-xl font-bold text-white mb-1">Quick Edit</h3>
                <p className="text-slate-400 text-sm mb-6">{editingItem.name}</p>

                <form onSubmit={handleUpdateItem} className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-medium text-slate-400 block mb-1">Cost (€)</label>
                            <input
                                type="number" step="0.01" min="0" required
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                value={editForm.costPrice}
                                onChange={(e) => setEditForm({ ...editForm, costPrice: parseFloat(e.target.value) || 0 })}
                                title="Cost Price"
                                aria-label="Cost Price"
                                placeholder="Cost"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-medium text-slate-400 block mb-1">Price (€)</label>
                            <input
                                type="number" step="0.01" min="0" required
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                value={editForm.price}
                                onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                title="Price"
                                aria-label="Price"
                                placeholder="Price"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-400 block mb-1">Stock Quantity</label>
                        <input
                            type="number" min="0" required
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            value={editForm.stock}
                            onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })}
                            title="Stock Quantity"
                            aria-label="Stock Quantity"
                            placeholder="Stock Quantity"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-400 block mb-1">Reason for change</label>
                        <select
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            value={editForm.reason}
                            onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                            title="Reason for edit"
                            aria-label="Reason for edit"
                        >
                            <option value="Manual Correction">Manual Correction (E.g. Counting Error)</option>
                            <option value="Restock">Restock (Received new shipment)</option>
                            <option value="Return">Return (Customer returned item)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-400 block mb-1">Notes (Optional)</label>
                        <input
                            type="text" placeholder="Order # or supplier info"
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            value={editForm.notes}
                            onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 mt-2"
                    >
                        <Save size={18} /> Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
}
