import { useState, useEffect } from 'react';
import { Mail, Key, Eye, EyeOff, Save, CheckCircle, AlertTriangle, Loader2, Shield, Facebook } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

interface SocialProviderConfig {
    enabled: boolean;
    isConfigured: boolean;
    source: 'database' | 'env' | 'none';
}

interface GoogleConfig extends SocialProviderConfig {
    clientId: string;
    clientSecret: string;
}

interface FacebookConfig extends SocialProviderConfig {
    appId: string;
    appSecret: string;
}

interface SocialAuthConfig {
    google: GoogleConfig;
    facebook: FacebookConfig;
}

export const SocialAuthTab = () => {
    const [config, setConfig] = useState<SocialAuthConfig>({
        google: { enabled: false, clientId: '', clientSecret: '', isConfigured: false, source: 'none' },
        facebook: { enabled: false, appId: '', appSecret: '', isConfigured: false, source: 'none' }
    });
    
    const [showGoogleSecret, setShowGoogleSecret] = useState(false);
    const [showFacebookSecret, setShowFacebookSecret] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSocialAuthSettings();
    }, []);

    const fetchSocialAuthSettings = async () => {
        try {
            const response = await api.get('/api/settings/social-auth');
            const data = (response as any)?.data || response;
            if (data.success) {
                setConfig(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch Social Auth settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await api.put('/api/settings/social-auth', config);
            const data = (response as any)?.data || response;
            if (data.success) {
                toast.success('✅ Social Login-Einstellungen gespeichert!');
                setConfig(prev => ({
                    google: { ...prev.google, ...data.data.google, source: data.data.google.isConfigured ? 'database' : prev.google.source },
                    facebook: { ...prev.facebook, ...data.data.facebook, source: data.data.facebook.isConfigured ? 'database' : prev.facebook.source }
                }));
            } else {
                toast.error(data.message || 'Speichern fehlgeschlagen');
            }
        } catch (err) {
            toast.error('Fehler beim Speichern');
        } finally {
            setSaving(false);
        }
    };

    const handleGoogleChange = (key: keyof GoogleConfig, value: any) => {
        setConfig(prev => ({ ...prev, google: { ...prev.google, [key]: value } }));
    };

    const handleFacebookChange = (key: keyof FacebookConfig, value: any) => {
        setConfig(prev => ({ ...prev, facebook: { ...prev.facebook, [key]: value } }));
    };

    if (loading) return <div className="text-slate-400 py-8 text-center">Lade Social Auth Einstellungen...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Key className="text-blue-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Social Login (OAuth)</h3>
                    <p className="text-slate-400 text-sm">
                        Verwalten Sie die API-Schlüssel für Google und Facebook Login.
                    </p>
                </div>
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-900/10 border border-blue-500/20">
                <Shield className="text-blue-400 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-blue-300/80 leading-relaxed">
                    Die App Secrets (Geheimschlüssel) werden mit <strong>AES-256</strong> verschlüsselt in der Datenbank gespeichert und niemals im Klartext angezeigt.
                    Änderungen werden sofort wirksam, ohne dass der Server neu gestartet werden muss.
                </p>
            </div>

            {/* ─── Google Settings ─── */}
            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-bold flex items-center gap-2">
                        <Mail className="text-red-400" size={18} /> Google Login
                    </h4>
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={config.google.enabled} onChange={e => handleGoogleChange('enabled', e.target.checked)} />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${config.google.enabled ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.google.enabled ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                        <span className="ml-3 text-sm font-medium text-slate-300">{config.google.enabled ? 'Aktiviert' : 'Deaktiviert'}</span>
                    </label>
                </div>

                {/* Google Status */}
                <div className="flex items-center gap-2 mb-4 text-xs">
                    {config.google.isConfigured ? (
                        <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={14} /> Konfiguriert (Datenbank)</span>
                    ) : config.google.source === 'env' ? (
                        <span className="flex items-center gap-1 text-amber-400"><AlertTriangle size={14} /> Konfiguriert (.env Datei)</span>
                    ) : (
                        <span className="flex items-center gap-1 text-red-400"><AlertTriangle size={14} /> Nicht konfiguriert</span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">Client ID</label>
                        <input
                            value={config.google.clientId}
                            onChange={e => handleGoogleChange('clientId', e.target.value)}
                            placeholder="xxx-yyy.apps.googleusercontent.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none"
                            disabled={!config.google.enabled}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">
                            Client Secret
                            {config.google.isConfigured && <span className="text-emerald-400 text-xs ml-2">(verschlüsselt)</span>}
                        </label>
                        <div className="relative">
                            <input
                                type={showGoogleSecret ? 'text' : 'password'}
                                value={config.google.clientSecret}
                                onChange={e => handleGoogleChange('clientSecret', e.target.value)}
                                placeholder={config.google.isConfigured ? '••••••••' : 'GOCSPX-...'}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 pr-12 text-white focus:border-cyan-500 outline-none"
                                disabled={!config.google.enabled}
                            />
                            <button
                                type="button"
                                onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                disabled={!config.google.enabled}
                            >
                                {showGoogleSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="text-xs text-slate-500 mt-2">
                    Callback URL: <code className="bg-slate-800 px-1 rounded text-cyan-300">https://[your-domain]/api/auth/google/callback</code>
                </div>
            </div>

            {/* ─── Facebook Settings ─── */}
            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-bold flex items-center gap-2">
                        <Facebook className="text-blue-500" size={18} /> Facebook Login
                    </h4>
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={config.facebook.enabled} onChange={e => handleFacebookChange('enabled', e.target.checked)} />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${config.facebook.enabled ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.facebook.enabled ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                        <span className="ml-3 text-sm font-medium text-slate-300">{config.facebook.enabled ? 'Aktiviert' : 'Deaktiviert'}</span>
                    </label>
                </div>

                {/* Facebook Status */}
                <div className="flex items-center gap-2 mb-4 text-xs">
                    {config.facebook.isConfigured ? (
                        <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={14} /> Konfiguriert (Datenbank)</span>
                    ) : config.facebook.source === 'env' ? (
                        <span className="flex items-center gap-1 text-amber-400"><AlertTriangle size={14} /> Konfiguriert (.env Datei)</span>
                    ) : (
                        <span className="flex items-center gap-1 text-red-400"><AlertTriangle size={14} /> Nicht konfiguriert</span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">App ID</label>
                        <input
                            value={config.facebook.appId}
                            onChange={e => handleFacebookChange('appId', e.target.value)}
                            placeholder="123456789012345"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none"
                            disabled={!config.facebook.enabled}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">
                            App Secret
                            {config.facebook.isConfigured && <span className="text-emerald-400 text-xs ml-2">(verschlüsselt)</span>}
                        </label>
                        <div className="relative">
                            <input
                                type={showFacebookSecret ? 'text' : 'password'}
                                value={config.facebook.appSecret}
                                onChange={e => handleFacebookChange('appSecret', e.target.value)}
                                placeholder={config.facebook.isConfigured ? '••••••••' : 'e.g. a1b2c3...'}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 pr-12 text-white focus:border-cyan-500 outline-none"
                                disabled={!config.facebook.enabled}
                            />
                            <button
                                type="button"
                                onClick={() => setShowFacebookSecret(!showFacebookSecret)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                disabled={!config.facebook.enabled}
                            >
                                {showFacebookSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="text-xs text-slate-500 mt-2">
                    Callback URL: <code className="bg-slate-800 px-1 rounded text-cyan-300">https://[your-domain]/api/auth/facebook/callback</code>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-2">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/20"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Speichern...' : 'Verschlüsselt speichern'}
                </button>
            </div>
        </div>
    );
};
