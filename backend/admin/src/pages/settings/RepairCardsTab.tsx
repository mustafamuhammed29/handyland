import React from 'react';
import { Wrench, Plus, Trash2 } from 'lucide-react';

interface Props {
    settings: any;
    handleChange: any;
}

export const RepairCardsTab: React.FC<Props> = ({ settings, handleChange }) => {
    const cards = settings.repairPreviewCards || [
        { iconName: 'Monitor', label: 'Displayreparatur', price: 'ab €49', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { iconName: 'Battery', label: 'Akkutausch', price: 'ab €39', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { iconName: 'Smartphone', label: 'Ladebuchse', price: 'ab €29', color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { iconName: 'Wrench', label: 'Diagnose', price: 'Kostenlos', color: 'text-purple-400', bg: 'bg-purple-500/10' }
    ];

    const updateCard = (index: number, field: string, value: string) => {
        const newCards = [...cards];
        newCards[index] = { ...newCards[index], [field]: value };
        handleChange(null, 'repairPreviewCards', newCards);
    };

    const addCard = () => {
        const newCards = [...cards, { iconName: 'Wrench', label: 'Neuer Service', price: 'ab €0', color: 'text-blue-400', bg: 'bg-blue-500/10' }];
        handleChange(null, 'repairPreviewCards', newCards);
    };

    const removeCard = (index: number) => {
        const newCards = cards.filter((_: any, i: number) => i !== index);
        handleChange(null, 'repairPreviewCards', newCards);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                        <Wrench className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Repair Preview Cards</h3>
                        <p className="text-slate-400 text-sm">Manage the quick service cards shown on the home page.</p>
                    </div>
                </div>
                <button
                    onClick={addCard}
                    className="flex items-center gap-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg font-bold transition-all border border-blue-500/30"
                >
                    <Plus size={18} /> Add Card
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card: any, index: number) => (
                    <div key={index} className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 relative group">
                        <button 
                            onClick={() => removeCard(index)}
                            title="Delete card"
                            aria-label="Delete card"
                            className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={18} />
                        </button>
                        
                        <div className="space-y-4 mt-2">
                            <div>
                                <label className="block text-slate-400 text-xs font-bold mb-1">Service Label</label>
                                <input
                                    value={card.label}
                                    onChange={(e) => updateCard(index, 'label', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none text-sm"
                                    placeholder="e.g. Displayreparatur"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-1">Price Text</label>
                                    <input
                                        value={card.price}
                                        onChange={(e) => updateCard(index, 'price', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none text-sm"
                                        placeholder="e.g. ab €49"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-1">Lucide Icon Name</label>
                                    <input
                                        value={card.iconName}
                                        onChange={(e) => updateCard(index, 'iconName', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none text-sm"
                                        placeholder="e.g. Monitor, Battery"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-1">Text Color Class</label>
                                    <input
                                        value={card.color}
                                        onChange={(e) => updateCard(index, 'color', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none text-sm font-mono"
                                        placeholder="text-cyan-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-1">Bg Color Class</label>
                                    <input
                                        value={card.bg}
                                        onChange={(e) => updateCard(index, 'bg', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none text-sm font-mono"
                                        placeholder="bg-cyan-500/10"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {cards.length === 0 && (
                <div className="text-center py-10 border border-dashed border-slate-700 rounded-xl text-slate-500">
                    No repair cards configured. Click "Add Card" to create one.
                </div>
            )}
        </div>
    );
};
