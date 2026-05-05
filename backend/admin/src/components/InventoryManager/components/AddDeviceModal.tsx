import React, { useState } from 'react';
import { X, Smartphone, Save } from 'lucide-react';

interface AddDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    handleAddDeviceSave: (form: any) => Promise<{ success: boolean; error?: string }>;
}

export function AddDeviceModal({ isOpen, onClose, handleAddDeviceSave }: AddDeviceModalProps) {
    const [addForm, setAddForm] = useState({
        name: '', category: 'Smartphones', brand: '', model: '', price: 0, costPrice: 0, 
        stock: 0, minStock: 2, barcode: '', supplierName: '', supplierContact: '', 
        image: '', description: '', condition: 'New', color: '', storage: '', battery: '', processor: '',
        isMarginScheme: false, imeis: ''
    });

    if (!isOpen) return null;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Process IMEIs — use a typed payload separate from form state
        const payload: Record<string, any> = { ...addForm };
        if (addForm.imeis) {
            const parsedImeis = addForm.imeis
                .split('\n')
                .map((code: string) => code.trim())
                .filter((code: string) => code.length > 0)
                .map((code: string) => ({ code, status: 'available', costPrice: addForm.costPrice }));
            
            payload.imeis = parsedImeis;
            payload.stock = parsedImeis.length;
        } else {
            payload.imeis = [];
        }

        const result = await handleAddDeviceSave(payload);
        if (result.success) {
            setAddForm({
                name: '', category: 'Smartphones', brand: '', model: '', price: 0, costPrice: 0, 
                stock: 0, minStock: 2, barcode: '', supplierName: '', supplierContact: '', 
                image: '', description: '', condition: 'New', color: '', storage: '', battery: '', processor: '',
                isMarginScheme: false, imeis: ''
            });
            alert("Device added successfully!");
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
                className="bg-slate-900 border border-slate-700/50 w-full max-w-3xl rounded-2xl p-6 md:p-8 relative shadow-[0_0_40px_rgba(0,0,0,0.5)] my-8 animate-in zoom-in-95 duration-200"
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
                    <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">Add New Device</h3>
                        <p className="text-slate-400 text-sm">Add a new mobile phone or tablet to the inventory.</p>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Form Fields */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Device Name *</label>
                        <input
                            type="text" required placeholder="E.g. iPhone 15 Pro Max 256GB"
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category *</label>
                        <select
                            required
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            value={addForm.category} onChange={e => setAddForm({ ...addForm, category: e.target.value })}
                            title="Category"
                            aria-label="Category"
                        >
                            <option value="Smartphones">Smartphones</option>
                            <option value="Tablets">Tablets</option>
                            <option value="Laptops">Laptops</option>
                            <option value="Smartwatches">Smartwatches</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand</label>
                            <input
                                type="text" placeholder="E.g. Apple"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                value={addForm.brand} onChange={e => setAddForm({ ...addForm, brand: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Model</label>
                            <input
                                type="text" placeholder="E.g. iPhone 15 Pro"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                value={addForm.model} onChange={e => setAddForm({ ...addForm, model: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Condition</label>
                            <select
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                value={addForm.condition} onChange={e => setAddForm({ ...addForm, condition: e.target.value })}
                                title="Device Condition"
                                aria-label="Device Condition"
                            >
                                <option value="New">Brand New</option>
                                <option value="Like New">Like New (Grade A+)</option>
                                <option value="Good">Good (Grade A)</option>
                                <option value="Fair">Fair (Grade B)</option>
                                <option value="Poor">Poor (Grade C)</option>
                                <option value="Refurbished">Refurbished</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Storage</label>
                            <input
                                type="text" placeholder="E.g. 256GB"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                value={addForm.storage} onChange={e => setAddForm({ ...addForm, storage: e.target.value })}
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cost Price (€) *</label>
                            <input
                                type="number" step="0.01" min="0" required placeholder="e.g. 500"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                value={addForm.costPrice === 0 ? '' : addForm.costPrice} onChange={e => setAddForm({ ...addForm, costPrice: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sale Price (€) *</label>
                            <input
                                type="number" step="0.01" min="0" required placeholder="e.g. 800"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                value={addForm.price === 0 ? '' : addForm.price} onChange={e => setAddForm({ ...addForm, price: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                            <input 
                                type="checkbox" 
                                id="marginScheme"
                                className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-900/50"
                                checked={addForm.isMarginScheme}
                                onChange={(e) => setAddForm({ ...addForm, isMarginScheme: e.target.checked })}
                            />
                            <label htmlFor="marginScheme" className="text-sm font-medium text-slate-300 cursor-pointer">
                                Apply Margin Scheme (§25a UStG) - Used for secondhand goods
                            </label>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-1 bg-blue-900/10 p-4 rounded-xl border border-blue-500/20">
                        <label className="text-xs font-bold text-blue-400 uppercase tracking-wider flex justify-between items-center mb-1">
                            <span>Available IMEIs / Serial Numbers</span>
                            <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded-full">Auto-Stock</span>
                        </label>
                        <textarea
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                            rows={4}
                            placeholder="Scan or type one IMEI per line..."
                            value={addForm.imeis}
                            onChange={(e) => setAddForm({ ...addForm, imeis: e.target.value })}
                        />
                        <p className="text-xs text-slate-500 mt-1">Stock quantity will be calculated automatically based on the number of IMEIs added.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier Name</label>
                            <input
                                type="text" placeholder="Supplier or Customer Name"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                value={addForm.supplierName} onChange={e => setAddForm({ ...addForm, supplierName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Barcode / SKU</label>
                            <input
                                type="text" placeholder="Scan or type barcode"
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none focus:bg-slate-900 font-mono transition-all"
                                value={addForm.barcode} onChange={e => setAddForm({ ...addForm, barcode: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Image URL (Optional)</label>
                        <input
                            type="url" placeholder="https://..."
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            value={addForm.image} onChange={e => setAddForm({ ...addForm, image: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2 mt-4">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
                        >
                            <Save size={20} /> Save Device
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
