import { AlertCircle } from 'lucide-react';
import { Input } from '../SettingsManager';

export const SuspensionSettingsTab = ({ settings, handleChange }: any) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-500/10 rounded-xl">
                    <AlertCircle className="text-red-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Account Suspension Message</h3>
                    <p className="text-slate-400 text-sm">Customize the message shown to blocked users when they try to log in.</p>
                </div>
            </div>

            {/* Live Preview */}
            <div className="p-5 border border-red-500/30 rounded-xl bg-red-900/10">
                <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-3">👁 Live Preview</p>
                <div className="p-5 bg-red-900/30 border-2 border-red-500/70 rounded-xl flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <p className="text-red-300 font-bold text-sm">{settings.accountSuspension?.title || 'Account Suspended'}</p>
                            <p className="text-red-400/80 text-xs mt-0.5">{settings.accountSuspension?.subtitle || 'حسابك محظور من قِبَل الإدارة'}</p>
                        </div>
                    </div>
                    <p className="text-red-400 text-sm leading-relaxed">{settings.accountSuspension?.message || 'Your account has been suspended...'}</p>
                    <span className="text-xs text-orange-400 underline font-semibold">
                        📩 {settings.accountSuspension?.supportLabel || 'Contact Support'}: {settings.accountSuspension?.supportEmail || 'support@handyland.com'}
                    </span>
                </div>
            </div>

            {/* Edit Fields */}
            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4">
                <h4 className="text-red-400 font-bold mb-2">Message Content</h4>
                <Input
                    label="Banner Title (e.g. Account Suspended)"
                    value={settings.accountSuspension?.title || ''}
                    onChange={(v: string) => handleChange('accountSuspension', 'title', v)}
                    placeholder="Account Suspended"
                />
                <Input
                    label="Subtitle (Arabic or localized line)"
                    value={settings.accountSuspension?.subtitle || ''}
                    onChange={(v: string) => handleChange('accountSuspension', 'subtitle', v)}
                    placeholder="حسابك محظور من قِبَل الإدارة"
                />
                <div>
                    <label className="block text-slate-400 text-sm font-bold mb-2">Main Message Body</label>
                    <textarea
                        value={settings.accountSuspension?.message || ''}
                        onChange={(e) => handleChange('accountSuspension', 'message', e.target.value)}
                        rows={3}
                        placeholder="Your account has been suspended. Please contact support for assistance."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-red-500 outline-none resize-none"
                    />
                </div>
            </div>

            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4">
                <h4 className="text-orange-400 font-bold mb-2">Support Contact Link</h4>
                <Input
                    label="Support Button Label"
                    value={settings.accountSuspension?.supportLabel || ''}
                    onChange={(v: string) => handleChange('accountSuspension', 'supportLabel', v)}
                    placeholder="Contact Support"
                />
                <Input
                    label="Support Email Address"
                    value={settings.accountSuspension?.supportEmail || ''}
                    onChange={(v: string) => handleChange('accountSuspension', 'supportEmail', v)}
                    placeholder="support@handyland.com"
                />
                <p className="text-xs text-slate-500">This email is used as the mailto: link for blocked users to reach your support team.</p>
            </div>
        </div>
    );
};
