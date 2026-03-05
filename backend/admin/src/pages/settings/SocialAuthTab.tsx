import { Toggle } from '../SettingsManager';
import { AlertCircle } from 'lucide-react';

export const SocialAuthTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">Social Login & Authentication</h3>
            <p className="text-slate-400 text-sm">Control which login methods are available to your users.</p>

            <div className="p-4 border border-slate-700 rounded-xl space-y-4 bg-slate-900/50">
                <h4 className="text-blue-400 font-bold mb-4">Social Auth Providers</h4>
                <Toggle
                    label="Enable Google Login"
                    value={settings.socialAuth?.google || false}
                    onChange={(v: boolean) => handleChange('socialAuth', 'google', v)}
                />
                <Toggle
                    label="Enable Facebook Login"
                    value={settings.socialAuth?.facebook || false}
                    onChange={(v: boolean) => handleChange('socialAuth', 'facebook', v)}
                />
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-sm text-blue-300 flex gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>Note: To use social login, ensure you have configured your Client IDs and Secrets in the backend <code>.env</code> file.</p>
                </div>
            </div>
        </div>
    );
};
