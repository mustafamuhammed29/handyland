import React from 'react';
import { X, Check, Save, Loader2, Plus } from 'lucide-react';
import { Address } from '../../../types';

interface AddressModalProps {
    showAddrModal: boolean;
    editingAddr: Address | null;
    closeAddrModal: () => void;
    addrForm: any;
    setAddrForm: React.Dispatch<React.SetStateAction<any>>;
    submitAddr: () => Promise<void>;
    addrSaving: boolean;
}

export const AddressModal: React.FC<AddressModalProps> = ({
    showAddrModal,
    editingAddr,
    closeAddrModal,
    addrForm,
    setAddrForm,
    submitAddr,
    addrSaving,
}) => {
    if (!showAddrModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                    <h4 className="text-white font-bold">{editingAddr ? 'Edit Address' : 'Add New Address'}</h4>
                    <button onClick={closeAddrModal} aria-label="Close modal" className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="overflow-y-auto p-6 space-y-4 flex-1">
                    {[
                        { id: 'addr-name', label: 'Recipient Name', field: 'name' as const, placeholder: 'John Doe' },
                        { id: 'addr-street', label: 'Street Address', field: 'street' as const, placeholder: '123 Main St' },
                    ].map(f => (
                        <div key={f.id}>
                            <label htmlFor={f.id} className="block text-sm font-medium text-slate-400 mb-1.5">{f.label}</label>
                            <input id={f.id} type="text" placeholder={f.placeholder} value={(addrForm as any)[f.field]}
                                onChange={e => setAddrForm((p: any) => ({ ...p, [f.field]: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-blue-500 placeholder:text-slate-600 transition-colors" />
                        </div>
                    ))}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'addr-city', label: 'City', field: 'city' as const, placeholder: 'Berlin' },
                            { id: 'addr-state', label: 'State / Region', field: 'state' as const, placeholder: 'BE' },
                        ].map(f => (
                            <div key={f.id}>
                                <label htmlFor={f.id} className="block text-sm font-medium text-slate-400 mb-1.5">{f.label}</label>
                                <input id={f.id} type="text" placeholder={f.placeholder} value={(addrForm as any)[f.field]}
                                    onChange={e => setAddrForm((p: any) => ({ ...p, [f.field]: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-blue-500 placeholder:text-slate-600 transition-colors" />
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'addr-zip', label: 'ZIP / Postal Code', field: 'zipCode' as const, placeholder: '10115' },
                            { id: 'addr-country', label: 'Country', field: 'country' as const, placeholder: 'Germany' },
                        ].map(f => (
                            <div key={f.id}>
                                <label htmlFor={f.id} className="block text-sm font-medium text-slate-400 mb-1.5">{f.label}</label>
                                <input id={f.id} type="text" placeholder={f.placeholder} value={(addrForm as any)[f.field]}
                                    onChange={e => setAddrForm((p: any) => ({ ...p, [f.field]: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-blue-500 placeholder:text-slate-600 transition-colors" />
                            </div>
                        ))}
                    </div>
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-blue-500/40 cursor-pointer transition-colors">
                        <div onClick={() => setAddrForm((p: any) => ({ ...p, isDefault: !p.isDefault }))}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${addrForm.isDefault ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
                            {addrForm.isDefault && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                            <p className="text-sm text-white font-medium">Set as default address</p>
                            <p className="text-xs text-slate-400">Used automatically at checkout</p>
                        </div>
                    </label>
                </div>
                <div className="px-6 py-4 border-t border-slate-800 flex gap-3">
                    <button onClick={closeAddrModal} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 text-sm font-medium transition-colors">
                        Cancel
                    </button>
                    <button onClick={submitAddr} disabled={addrSaving || !addrForm.name || !addrForm.street || !addrForm.city}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-900/20">
                        {addrSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingAddr ? <><Save className="w-4 h-4" /> Update</> : <><Plus className="w-4 h-4" /> Save Address</>}
                    </button>
                </div>
            </div>
        </div>
    );
};
