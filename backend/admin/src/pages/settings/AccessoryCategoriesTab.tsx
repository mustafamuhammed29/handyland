import { Input } from '../SettingsManager';
import { Plus, Trash2, Headphones, Zap, Shield, Watch, Battery, Cable, Smartphone, Monitor, Bluetooth, Speaker, Layers, Sparkles } from 'lucide-react';

const ICON_OPTIONS = [
    { value: 'Headphones', label: 'Audio / Headphones', icon: <Headphones size={16} /> },
    { value: 'Zap', label: 'Power / Charging', icon: <Zap size={16} /> },
    { value: 'Shield', label: 'Protection / Cases', icon: <Shield size={16} /> },
    { value: 'Watch', label: 'Wearables / Smartwatches', icon: <Watch size={16} /> },
    { value: 'Battery', label: 'Batteries / Powerbanks', icon: <Battery size={16} /> },
    { value: 'Cable', label: 'Cables / Adapters', icon: <Cable size={16} /> },
    { value: 'Smartphone', label: 'Phone Accessories', icon: <Smartphone size={16} /> },
    { value: 'Monitor', label: 'Screen Protectors', icon: <Monitor size={16} /> },
    { value: 'Bluetooth', label: 'Bluetooth Devices', icon: <Bluetooth size={16} /> },
    { value: 'Speaker', label: 'Speakers', icon: <Speaker size={16} /> },
    { value: 'Sparkles', label: 'Sparkles / General', icon: <Sparkles size={16} /> },
];

export const AccessoryCategoriesTab = ({ settings, handleChange }: any) => {
    const categories = Array.isArray(settings.accessoryCategories) ? settings.accessoryCategories : [];

    const handleAddCategory = (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        const newId = `cat_${Date.now()}`;
        const newCategories = [...categories, { id: newId, label: '', icon: 'Sparkles' }];
        handleChange(null, 'accessoryCategories', newCategories);
    };

    const handleRemoveCategory = (index: number, e: React.MouseEvent) => {
        e.preventDefault();
        const newCategories = categories.filter((_: any, i: number) => i !== index);
        handleChange(null, 'accessoryCategories', newCategories);
    };

    const handleUpdateCategory = (index: number, field: 'id' | 'label' | 'icon', value: string) => {
        const newCategories = [...categories];
        newCategories[index] = { ...newCategories[index], [field]: value };
        // If label changes and id is somehow generic, we could auto-slugify it, but letting user set ID is safer for DB filtering
        handleChange(null, 'accessoryCategories', newCategories);
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="space-y-4 mb-12">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-cyan-500/10 rounded-xl">
                            <Layers className="text-cyan-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Accessory Categories</h3>
                            <p className="text-slate-400 text-sm">Manage the dynamic categories used for accessories in the store and admin panel.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleAddCategory}
                        className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold transition-all text-sm"
                    >
                        <Plus size={16} /> Add Category
                    </button>
                </div>

                <div className="space-y-4">
                    {categories.map((cat: any, index: number) => (
                        <div key={index} className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4 relative group">
                            <button
                                type="button"
                                onClick={(e) => handleRemoveCategory(index, e)}
                                className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove Category"
                            >
                                <Trash2 size={18} />
                            </button>
                            
                            <div className="pr-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    label="Category ID (URL safe, e.g. 'audio')"
                                    value={cat.id}
                                    onChange={(v: string) => handleUpdateCategory(index, 'id', v.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                                    placeholder="e.g. smart-home"
                                />
                                <Input
                                    label="Display Label (e.g. 'Audio & Sound')"
                                    value={cat.label}
                                    onChange={(v: string) => handleUpdateCategory(index, 'label', v)}
                                    placeholder="e.g. Smart Home"
                                />
                                <div>
                                    <label className="block text-slate-400 text-sm font-bold mb-2">Category Icon</label>
                                    <select
                                        value={cat.icon}
                                        onChange={(e) => handleUpdateCategory(index, 'icon', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                    >
                                        {ICON_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {categories.length === 0 && (
                        <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl bg-slate-900/20">
                            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <h4 className="text-slate-300 font-bold">No Categories added yet</h4>
                            <p className="text-slate-500 text-sm mt-1 mb-4">Click the button below to add your first category.</p>
                            <button
                                type="button"
                                onClick={handleAddCategory}
                                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-bold text-sm bg-slate-800 px-4 py-2 rounded-lg"
                            >
                                <Plus size={16} /> Add Category
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
