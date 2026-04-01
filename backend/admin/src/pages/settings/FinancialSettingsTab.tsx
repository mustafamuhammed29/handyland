import React from 'react';
import { Trash2 } from 'lucide-react';

interface FinancialSettingsTabProps {
    settings: any;
    handleChange: (section: any, key: string, value: any) => void;
}

export const FinancialSettingsTab: React.FC<FinancialSettingsTabProps> = ({ settings, handleChange }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Tax Settings */}
            <div>
                <h3 className="text-xl font-bold text-white mb-2 text-glow">Tax Configuration</h3>
                <p className="text-slate-400 text-sm mb-4">Set the global Value Added Tax (VAT) rate for all purchases and checkout totals.</p>
                <div className="p-5 border border-slate-800 rounded-2xl bg-slate-950/50">
                    <label className="block text-slate-400 text-sm font-bold mb-2">VAT Percentage (%)</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={settings.taxRate ?? 19}
                        onChange={(e) => handleChange(null, 'taxRate', Number(e.target.value))}
                        title="VAT Percentage"
                        aria-label="VAT Percentage"
                        placeholder="19"
                        className="w-full md:w-1/3 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none focus:ring-1 focus:ring-brand-primary/50 transition-all font-bold"
                    />
                    <p className="text-xs text-slate-500 mt-2">Example: Enter 19 for 19% VAT.</p>
                </div>
            </div>

            {/* VIP Tiers Settings */}
            <div>
                <h3 className="text-xl font-bold text-white mb-2 text-glow flex items-center justify-between">
                    <span>VIP Loyalty Tiers</span>
                    <button
                        onClick={() => {
                            const newTier = {
                                id: `tier_${Date.now()}`,
                                name: 'New Tier',
                                color: 'from-slate-500 to-slate-700',
                                minSpent: 0,
                                maxSpent: 1000
                            };
                            handleChange(null, 'vipTiers', [...(settings.vipTiers || []), newTier]);
                        }}
                        className="text-xs bg-brand-primary hover:bg-brand-primary/80 text-white px-3 py-1.5 rounded-lg shadow-lg shadow-brand-primary/20 transition-all font-bold"
                    >
                        + Add Tier
                    </button>
                </h3>
                <p className="text-slate-400 text-sm mb-4">Configure the customer loyalty milestones. Tiers are automatically calculated based on total customer spend.</p>
                
                <div className="space-y-4">
                    {(settings.vipTiers || []).map((tier: any, idx: number) => (
                        <div key={idx} className="p-4 border border-slate-800 rounded-2xl bg-slate-950/50 flex flex-col md:flex-row gap-4 items-start md:items-center relative group">
                            
                            {/* Visual Preview */}
                            <div className={`shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg`}>
                                <span className="text-white font-black text-xs uppercase text-center drop-shadow-md">{tier.name.slice(0,4)}</span>
                            </div>

                            {/* Inputs */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                                <div>
                                    <label className="block text-xs text-slate-500 font-bold mb-1">Tier Name</label>
                                    <input
                                        type="text"
                                        value={tier.name}
                                        onChange={(e) => {
                                            const newTiers = [...settings.vipTiers];
                                            newTiers[idx] = { ...tier, name: e.target.value };
                                            handleChange(null, 'vipTiers', newTiers);
                                        }}
                                        title="Tier Name"
                                        aria-label="Tier Name"
                                        placeholder="Tier Name"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 font-bold mb-1">Gradient Colors (Tailwind)</label>
                                    <input
                                        type="text"
                                        value={tier.color}
                                        onChange={(e) => {
                                            const newTiers = [...settings.vipTiers];
                                            newTiers[idx] = { ...tier, color: e.target.value };
                                            handleChange(null, 'vipTiers', newTiers);
                                        }}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-primary outline-none"
                                        placeholder="from-cyan-300 to-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 font-bold mb-1">Min Spent (€)</label>
                                    <input
                                        type="number"
                                        value={tier.minSpent}
                                        onChange={(e) => {
                                            const newTiers = [...settings.vipTiers];
                                            newTiers[idx] = { ...tier, minSpent: Number(e.target.value) };
                                            handleChange(null, 'vipTiers', newTiers);
                                        }}
                                        title="Minimum Spent"
                                        aria-label="Minimum Spent"
                                        placeholder="0"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 font-bold mb-1">Max/Next Tier (€)</label>
                                    <input
                                        type="number"
                                        value={tier.maxSpent}
                                        onChange={(e) => {
                                            const newTiers = [...settings.vipTiers];
                                            newTiers[idx] = { ...tier, maxSpent: Number(e.target.value) };
                                            handleChange(null, 'vipTiers', newTiers);
                                        }}
                                        title="Max/Next Tier"
                                        aria-label="Max/Next Tier"
                                        placeholder="1000"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-primary outline-none"
                                    />
                                </div>
                            </div>
                            
                            <button
                                onClick={() => {
                                    const newTiers = settings.vipTiers.filter((_: any, i: number) => i !== idx);
                                    handleChange(null, 'vipTiers', newTiers);
                                }}
                                title="Delete Tier"
                                aria-label="Delete Tier"
                                className="absolute top-2 right-2 md:relative md:top-auto md:right-auto text-slate-600 hover:text-red-400 p-2 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {(!settings.vipTiers || settings.vipTiers.length === 0) && (
                        <div className="text-center py-8 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                            <p className="text-slate-500">No VIP Tiers configured.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Eco-Impact Gamification Settings */}
            <div>
                <h3 className="text-xl font-bold text-emerald-400 mb-2 text-glow">Eco-Impact Gamification 🌍</h3>
                <p className="text-slate-400 text-sm mb-4">Control the environmental impact metrics shown on the user dashboard.</p>
                <div className="p-5 border border-emerald-900/30 rounded-2xl bg-emerald-950/20 space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-emerald-900/30">
                        <div>
                            <span className="text-white font-bold block">Enable Eco-Impact Widget</span>
                            <span className="text-slate-400 text-xs">Show the Gamification card on the customer dashboard.</span>
                        </div>
                        <button
                            type="button"
                            title="Toggle Eco-Impact Widget"
                            aria-label="Toggle Eco-Impact Widget"
                            onClick={() => handleChange('ecoImpact', 'enabled', !settings.ecoImpact?.enabled)}
                            className={`relative w-12 h-6 rounded-full transition-all ${settings.ecoImpact?.enabled !== false ? 'bg-emerald-500' : 'bg-slate-700'
                                }`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.ecoImpact?.enabled !== false ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-300 text-sm font-bold mb-2">CO₂ Saved per device (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                title="CO2 Saved per device"
                                aria-label="CO2 Saved per device"
                                value={settings.ecoImpact?.co2PerDevice ?? 79}
                                onChange={(e) => handleChange('ecoImpact', 'co2PerDevice', Number(e.target.value))}
                                className="w-full bg-slate-900 border border-emerald-900/50 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all"
                            />
                            <p className="text-xs text-slate-500 mt-2">Avg: 79kg (manufacturing footprint of a smartphone).</p>
                        </div>
                        <div>
                            <label className="block text-slate-300 text-sm font-bold mb-2">E-Waste Prevented per device (kg)</label>
                            <input
                                type="number"
                                step="0.01"
                                title="E-Waste Prevented per device"
                                aria-label="E-Waste Prevented per device"
                                value={settings.ecoImpact?.eWastePerDevice ?? 0.18}
                                onChange={(e) => handleChange('ecoImpact', 'eWastePerDevice', Number(e.target.value))}
                                className="w-full bg-slate-900 border border-emerald-900/50 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all"
                            />
                            <p className="text-xs text-slate-500 mt-2">Avg: 0.18kg (180g weight of a smartphone + battery).</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
