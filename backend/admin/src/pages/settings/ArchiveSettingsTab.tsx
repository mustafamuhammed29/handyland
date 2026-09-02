import { ScanLine, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '../SettingsManager';

export const ArchiveSettingsTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                        <ScanLine className="text-purple-400" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Repair Archive Overview</h3>
                        <p className="text-slate-400 text-sm">Configure the texts and metrics of the Repair Showcase section.</p>
                    </div>
                </div>
                <Link to="/archive" className="flex items-center gap-2 text-cyan-400 hover:text-white font-bold text-sm bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700 transition">
                    Manage Repair Cases <ArrowRight size={16} />
                </Link>
            </div>

            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4">
                <h4 className="text-purple-400 font-bold mb-2">Typography & CTA</h4>
                <Input label="Section Main Title" value={settings.repairArchive?.title} onChange={(v: string) => handleChange('repairArchive', 'title', v)} placeholder="REPAIR ARCHIVE" />
                <Input label="Section Subtitle" value={settings.repairArchive?.subtitle} onChange={(v: string) => handleChange('repairArchive', 'subtitle', v)} placeholder="Real documentation of our successful operations" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800 mt-4">
                    <Input label="Action Button Text" value={settings.repairArchive?.buttonText} onChange={(v: string) => handleChange('repairArchive', 'buttonText', v)} placeholder="View Full Archive" />
                    <Input label="Live Counter: Total Success Stories" value={settings.repairArchive?.totalRepairs?.toString()} onChange={(v: string) => handleChange('repairArchive', 'totalRepairs', Number(v))} type="number" />
                </div>
            </div>
        </div>
    );
};
