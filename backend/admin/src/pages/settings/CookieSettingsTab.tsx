import { Cookie, Settings2, ToggleLeft } from 'lucide-react';

const Input = ({ label, value, onChange, placeholder, type = 'text', textarea = false }: any) => (
    <div className="mb-4">
        <label className="block text-slate-400 text-sm font-bold mb-2">{label}</label>
        {textarea ? (
            <textarea
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none resize-none"
            />
        ) : (
            <input
                type={type}
                value={value || ''}
                onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
            />
        )}
    </div>
);

export const CookieSettingsTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Cookie className="text-blue-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Cookie Consent Configuration</h3>
                    <p className="text-slate-400 text-sm">Control the privacy policy banner, texts, and available cookie categories.</p>
                </div>
            </div>

            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h4 className="text-white font-bold flex items-center gap-2">
                            <ToggleLeft className="text-blue-400" size={18} /> Enable Cookie Banner
                        </h4>
                        <p className="text-slate-400 text-sm mt-1">If enabled, the cookie consent banner will appear for users until they accept/reject.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            aria-label="Enable Cookie Banner"
                            checked={settings.cookieConsent?.enabled ?? true}
                            onChange={(e) => handleChange('cookieConsent', 'enabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                
                <h4 className="text-blue-400 font-bold mb-4 border-t border-slate-800 pt-6">Banner Texts & Localization</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Input label="Banner Title" value={settings.cookieConsent?.title} onChange={(v: string) => handleChange('cookieConsent', 'title', v)} placeholder="Ihre Privatsphäre ist uns wichtig" />
                    </div>
                    <div className="md:col-span-2">
                        <Input label="Main Banner Message" value={settings.cookieConsent?.message} onChange={(v: string) => handleChange('cookieConsent', 'message', v)} textarea placeholder="Wir verwenden Cookies für eine Reihe von Auswertungen..." />
                    </div>
                </div>

                <h4 className="text-blue-400 font-bold mb-4 border-t border-slate-800 pt-6">Action Buttons</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input label="Accept All Button" value={settings.cookieConsent?.acceptAllBtn} onChange={(v: string) => handleChange('cookieConsent', 'acceptAllBtn', v)} placeholder="Alle akzeptieren" />
                    <Input label="Reject All Button" value={settings.cookieConsent?.rejectAllBtn} onChange={(v: string) => handleChange('cookieConsent', 'rejectAllBtn', v)} placeholder="Ich lehne ab" />
                    <Input label="Manage Button" value={settings.cookieConsent?.manageBtn} onChange={(v: string) => handleChange('cookieConsent', 'manageBtn', v)} placeholder="Einstellungen ändern" />
                    <Input label="Save Settings Button" value={settings.cookieConsent?.saveBtn} onChange={(v: string) => handleChange('cookieConsent', 'saveBtn', v)} placeholder="Einstellungen speichern" />
                </div>
            </div>

            <div className="p-5 border border-slate-700 rounded-xl space-y-5 bg-slate-900/50">
                <h4 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                    <Settings2 size={18} /> Category Details
                </h4>
                <p className="text-xs text-slate-500 mb-6">These are the specific cookie categories users can toggle in the Manage Preferences view.</p>
                
                <div className="space-y-6">
                    <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                        <h5 className="text-emerald-400 font-semibold mb-3">1. Strictly Necessary (Cannot be disabled)</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Category Title" value={settings.cookieConsent?.strictlyNecessaryTitle} onChange={(v: string) => handleChange('cookieConsent', 'strictlyNecessaryTitle', v)} placeholder="Technisch notwendige Cookies" />
                            <Input label="Description" value={settings.cookieConsent?.strictlyNecessaryDesc} onChange={(v: string) => handleChange('cookieConsent', 'strictlyNecessaryDesc', v)} placeholder="Erforderlich für die sichere Funktion..." />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                        <h5 className="text-cyan-400 font-semibold mb-3">2. Functional Cookies</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Category Title" value={settings.cookieConsent?.functionalTitle} onChange={(v: string) => handleChange('cookieConsent', 'functionalTitle', v)} placeholder="Funktions Cookies" />
                            <Input label="Description" value={settings.cookieConsent?.functionalDesc} onChange={(v: string) => handleChange('cookieConsent', 'functionalDesc', v)} placeholder="Ermöglicht der Website, erweiterte Funktionalität..." />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                        <h5 className="text-blue-400 font-semibold mb-3">3. Analytics & Performance</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Category Title" value={settings.cookieConsent?.analyticsTitle} onChange={(v: string) => handleChange('cookieConsent', 'analyticsTitle', v)} placeholder="Tracking und Performance Cookies" />
                            <Input label="Description" value={settings.cookieConsent?.analyticsDesc} onChange={(v: string) => handleChange('cookieConsent', 'analyticsDesc', v)} placeholder="Helfen uns zu verstehen..." />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                        <h5 className="text-purple-400 font-semibold mb-3">4. Marketing & Tracking</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Category Title" value={settings.cookieConsent?.marketingTitle} onChange={(v: string) => handleChange('cookieConsent', 'marketingTitle', v)} placeholder="Targeting und Werbung Cookies" />
                            <Input label="Description" value={settings.cookieConsent?.marketingDesc} onChange={(v: string) => handleChange('cookieConsent', 'marketingDesc', v)} placeholder="Wird verwendet, um Werbung zu liefern..." />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
