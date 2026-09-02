import { MessageSquare } from 'lucide-react';
import { Input } from '../SettingsManager';

export const ContentSettingsTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-500/10 rounded-xl">
                    <MessageSquare className="text-amber-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Section Typography Context</h3>
                    <p className="text-slate-400 text-sm">Manage the dynamic headers for various blocks on the homepage.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50">
                    <h4 className="text-amber-400 font-bold mb-4 flex items-center gap-2">Accessories Block</h4>
                    <div className="space-y-4">
                        <Input label="Block Title" value={settings.content?.accessoriesTitle} onChange={(v: string) => handleChange('content', 'accessoriesTitle', v)} placeholder="Premium Cases & Wraps" />
                        <Input label="Block Subtitle" value={settings.content?.accessoriesSubtitle} onChange={(v: string) => handleChange('content', 'accessoriesSubtitle', v)} placeholder="We offer more than just repairs." />
                    </div>
                </div>
                <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50">
                    <h4 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">Repair Services Block</h4>
                    <div className="space-y-4">
                        <Input label="Block Title" value={settings.content?.repairTitle} onChange={(v: string) => handleChange('content', 'repairTitle', v)} placeholder="Certified Component Exchange" />
                        <Input label="Block Subtitle" value={settings.content?.repairSubtitle} onChange={(v: string) => handleChange('content', 'repairSubtitle', v)} placeholder="Only OEM or top-grade components." />
                    </div>
                </div>
            </div>
        </div>
    );
};
