import { Toggle } from '../SettingsManager';

export const SectionsTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">Layout & Sections Control</h3>
            <p className="text-slate-400 text-sm">Toggle visibility of home page sections.</p>

            <div className="p-4 border border-slate-700 rounded-xl space-y-4 bg-slate-900/50">
                <Toggle
                    label="Show Hero Section"
                    value={settings.sections?.hero || false}
                    onChange={(v: boolean) => handleChange('sections', 'hero', v)}
                />
                <Toggle
                    label="Show Stats Section"
                    value={settings.sections?.stats || false}
                    onChange={(v: boolean) => handleChange('sections', 'stats', v)}
                />
                <Toggle
                    label="Show Repair Gallery"
                    value={settings.sections?.repairGallery || false}
                    onChange={(v: boolean) => handleChange('sections', 'repairGallery', v)}
                />
                <Toggle
                    label="Show Marketplace Highlights"
                    value={settings.sections?.marketplace || false}
                    onChange={(v: boolean) => handleChange('sections', 'marketplace', v)}
                />
                <Toggle
                    label="Show Accessories Section"
                    value={settings.sections?.accessories || false}
                    onChange={(v: boolean) => handleChange('sections', 'accessories', v)}
                />
                <Toggle
                    label="Show Contact Section"
                    value={settings.sections?.contact || false}
                    onChange={(v: boolean) => handleChange('sections', 'contact', v)}
                />
            </div>
        </div>
    );
};
