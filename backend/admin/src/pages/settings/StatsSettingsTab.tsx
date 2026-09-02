import { BarChart } from 'lucide-react';
import { Input } from '../SettingsManager';

export const StatsSettingsTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                    <BarChart className="text-emerald-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Live Performance Stats</h3>
                    <p className="text-slate-400 text-sm">Control the numbers displayed in the impact statistics row.</p>
                </div>
            </div>
            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50">
                <h4 className="text-emerald-400 font-bold mb-4">Core Numbers</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Devices Repaired / Traded" value={settings.stats?.devicesRepaired?.toString()} onChange={(v: string) => handleChange('stats', 'devicesRepaired', Number(v))} type="number" />
                    <Input label="Happy Customers" value={settings.stats?.happyCustomers?.toString()} onChange={(v: string) => handleChange('stats', 'happyCustomers', Number(v))} type="number" />
                    <Input label="Average Rating (out of 5)" value={settings.stats?.averageRating?.toString()} onChange={(v: string) => handleChange('stats', 'averageRating', Number(v))} type="number" />
                    <Input label="Years Experience in Market" value={settings.stats?.marketExperience?.toString()} onChange={(v: string) => handleChange('stats', 'marketExperience', Number(v))} type="number" />
                </div>
            </div>
        </div>
    );
};
