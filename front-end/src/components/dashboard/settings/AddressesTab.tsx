import React from 'react';
import { MapPin, Plus, Star, Pencil, Trash2 } from 'lucide-react';
import { Address } from '../../../types';

interface AddressesTabProps {
    addresses: Address[];
    openAddAddr: () => void;
    openEditAddr: (a: Address) => void;
    deleteAddr: (id: string) => void;
}

export const AddressesTab: React.FC<AddressesTabProps> = ({
    addresses,
    openAddAddr,
    openEditAddr,
    deleteAddr,
}) => {
    return (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">Saved Addresses</h3>
                    <p className="text-slate-400 text-sm mt-0.5">{addresses.length} address{addresses.length !== 1 ? 'es' : ''} saved</p>
                </div>
                <button onClick={openAddAddr}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-md shadow-blue-900/20">
                    <Plus className="w-4 h-4" /> Add Address
                </button>
            </div>

            <div className="p-4 space-y-3">
                {addresses.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-slate-500 gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center">
                            <MapPin className="w-7 h-7 opacity-40" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-slate-400">No saved addresses yet</p>
                            <p className="text-sm text-slate-500 mt-1">Add a shipping address for faster checkout</p>
                        </div>
                        <button onClick={openAddAddr}
                            className="mt-2 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/50 px-4 py-2 rounded-xl transition-colors">
                            <Plus className="w-4 h-4" /> Add your first address
                        </button>
                    </div>
                ) : (
                    addresses.map(addr => (
                        <div key={addr._id} className={`relative p-4 rounded-xl border transition-all ${addr.isDefault ? 'border-blue-600/50 bg-blue-900/10' : 'border-slate-800 bg-slate-800/30 hover:border-slate-700'}`}>
                            {addr.isDefault && (
                                <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold">
                                    <Star className="w-2.5 h-2.5" /> Default
                                </span>
                            )}
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0 pr-16">
                                    <p className="text-white font-bold text-sm">{addr.name}</p>
                                    <p className="text-slate-400 text-sm mt-0.5">
                                        {addr.street}, {addr.city}
                                        {(addr as any).postalCode || addr.zipCode ? `, ${(addr as any).postalCode || addr.zipCode}` : ''}
                                        {addr.country ? `, ${addr.country}` : ''}
                                    </p>
                                    {(addr as any).phone && <p className="text-slate-500 text-xs mt-1">{(addr as any).phone}</p>}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-3 ml-12">
                                <button onClick={() => openEditAddr(addr)}
                                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-400/5 hover:bg-blue-400/10 px-3 py-1.5 rounded-lg transition-colors border border-blue-400/15">
                                    <Pencil className="w-3 h-3" /> Edit
                                </button>
                                <button onClick={() => addr._id && deleteAddr(addr._id)}
                                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-400/5 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors border border-red-400/15">
                                    <Trash2 className="w-3 h-3" /> Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
