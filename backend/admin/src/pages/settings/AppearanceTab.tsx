import { Input, Toggle } from '../SettingsManager';

export const AppearanceTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">General Appearance</h3>
            <Input label="Site Name" value={settings.siteName} onChange={(v: string) => handleChange(null, 'siteName', v)} />

            <div className="p-4 border border-slate-700 rounded-xl bg-slate-900/50">
                <h4 className="text-blue-400 font-bold mb-4">Navbar Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Logo Text (Main)" value={settings.navbar?.logoText} onChange={(v: string) => handleChange('navbar', 'logoText', v)} placeholder="HANDY" />
                    <Input label="Logo Accent (Color)" value={settings.navbar?.logoAccentText} onChange={(v: string) => handleChange('navbar', 'logoAccentText', v)} placeholder="LAND" />
                </div>
                <div className="mt-4">
                    <Toggle label="Show Language Switcher" value={settings.navbar?.showLanguageSwitcher || false} onChange={(v: boolean) => handleChange('navbar', 'showLanguageSwitcher', v)} />
                </div>
            </div>

            <Input label="Contact Email" value={settings.contactEmail} onChange={(v: string) => handleChange(null, 'contactEmail', v)} />
            <Input label="Free Shipping Threshold (€)" value={settings.freeShippingThreshold?.toString()} onChange={(v: string) => handleChange(null, 'freeShippingThreshold', Number(v))} type="number" />
            <Input label="Footer Text" value={settings.footerText} onChange={(v: string) => handleChange(null, 'footerText', v)} />
        </div>
    );
};
