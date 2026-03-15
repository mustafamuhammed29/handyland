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

            <div className="p-4 border border-blue-900/40 rounded-xl bg-blue-950/20">
                <h4 className="text-blue-400 font-bold mb-4">Localization & Language</h4>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">System Default Language</label>
                    <div className="text-xs text-slate-500 mb-2">This language will be used as the default for the website interface and for all automated email & system notifications.</div>
                    <select
                        title="System Default Language"
                        value={settings.language || 'de'}
                        onChange={(e) => handleChange(null, 'language', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                    >
                        <option value="de">German (Deutsch)</option>
                        <option value="en">English</option>
                        <option value="ar">Arabic (العربية)</option>
                        <option value="tr">Turkish (Türkçe)</option>
                        <option value="ru">Russian (Русский)</option>
                        <option value="fa">Persian (فارسی)</option>
                    </select>
                </div>
            </div>
        </div>
    );
};
