import { useState, useEffect } from 'react';
import { Mail, Server, Lock, Eye, EyeOff, Send, CheckCircle, AlertTriangle, Loader2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

interface SmtpConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    fromEmail: string;
    fromName: string;
    isConfigured: boolean;
    source: 'database' | 'env' | 'none';
}

export const EmailSettingsTab = () => {
    const [config, setConfig] = useState<SmtpConfig>({
        host: '', port: 587, secure: false, user: '', pass: '',
        fromEmail: '', fromName: 'HandyLand', isConfigured: false, source: 'none'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        fetchSmtpSettings();
    }, []);

    const fetchSmtpSettings = async () => {
        try {
            const response = await api.get('/api/settings/smtp');
            const data = (response as any)?.data || response;
            if (data.success) {
                setConfig(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch SMTP settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config.host || !config.user) {
            toast.error('SMTP Host und Benutzer sind erforderlich.');
            return;
        }
        setSaving(true);
        try {
            const response = await api.put('/api/settings/smtp', config);
            const data = (response as any)?.data || response;
            if (data.success) {
                toast.success('✅ SMTP-Einstellungen gespeichert!');
                setConfig(prev => ({ ...prev, ...data.data, isConfigured: true, source: 'database' }));
            } else {
                toast.error(data.message || 'Speichern fehlgeschlagen');
            }
        } catch (err) {
            toast.error('Fehler beim Speichern');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!config.host || !config.user) {
            toast.error('Bitte zuerst SMTP-Einstellungen ausfüllen.');
            return;
        }
        setTesting(true);
        try {
            const response = await api.post('/api/settings/smtp/test', config);
            const data = (response as any)?.data || response;
            if (data.success) {
                toast.success('✅ ' + data.message);
            } else {
                toast.error('❌ ' + (data.message || 'Verbindungstest fehlgeschlagen'));
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Verbindungstest fehlgeschlagen';
            toast.error('❌ ' + msg);
        } finally {
            setTesting(false);
        }
    };

    const handleChange = (key: keyof SmtpConfig, value: string | number | boolean) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return <div className="text-slate-400 py-8 text-center">Lade E-Mail-Einstellungen...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-cyan-500/10 rounded-xl">
                    <Mail className="text-cyan-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">E-Mail Server (SMTP)</h3>
                    <p className="text-slate-400 text-sm">
                        Verwalten Sie Ihren SMTP-Server für E-Mail-Versand (Bestellbestätigungen, Passwort-Reset usw.)
                    </p>
                </div>
            </div>

            {/* Status Badge */}
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                config.isConfigured
                    ? 'bg-emerald-900/20 border-emerald-500/30'
                    : config.source === 'env'
                        ? 'bg-amber-900/20 border-amber-500/30'
                        : 'bg-red-900/20 border-red-500/30'
            }`}>
                {config.isConfigured ? (
                    <CheckCircle className="text-emerald-400 shrink-0" size={20} />
                ) : config.source === 'env' ? (
                    <AlertTriangle className="text-amber-400 shrink-0" size={20} />
                ) : (
                    <AlertTriangle className="text-red-400 shrink-0" size={20} />
                )}
                <div>
                    <p className={`font-bold text-sm ${
                        config.isConfigured ? 'text-emerald-400' : config.source === 'env' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                        {config.isConfigured
                            ? 'SMTP über Datenbank konfiguriert ✅'
                            : config.source === 'env'
                                ? 'SMTP über .env-Datei konfiguriert (nicht in Admin gespeichert)'
                                : 'SMTP nicht konfiguriert — E-Mails werden nicht versendet!'
                        }
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {config.isConfigured
                            ? 'Änderungen hier überschreiben die .env-Konfiguration.'
                            : config.source === 'env'
                                ? 'Speichern Sie hier, um die Konfiguration in die Datenbank zu übernehmen.'
                                : 'Tragen Sie unten Ihre SMTP-Zugangsdaten ein.'
                        }
                    </p>
                </div>
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-900/10 border border-blue-500/20">
                <Shield className="text-blue-400 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-blue-300/80 leading-relaxed">
                    Das Passwort wird mit <strong>AES-256</strong> verschlüsselt in der Datenbank gespeichert und niemals im Klartext angezeigt.
                    Für Gmail verwenden Sie ein <strong>App-Passwort</strong> (nicht Ihr normales Passwort).
                </p>
            </div>

            {/* SMTP Server Settings */}
            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4">
                <h4 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                    <Server size={16} /> Server-Einstellungen
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">SMTP Host</label>
                        <input
                            value={config.host}
                            onChange={e => handleChange('host', e.target.value)}
                            placeholder="smtp.gmail.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">Port</label>
                        <input
                            type="number"
                            value={config.port}
                            onChange={e => handleChange('port', parseInt(e.target.value) || 587)}
                            placeholder="587"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none"
                        />
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.secure}
                                onChange={e => handleChange('secure', e.target.checked)}
                                className="w-5 h-5 rounded accent-cyan-500"
                            />
                            <span className="text-slate-300 font-bold text-sm">SSL/TLS (Port 465)</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Authentication */}
            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4">
                <h4 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                    <Lock size={16} /> Authentifizierung
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">Benutzername / E-Mail</label>
                        <input
                            value={config.user}
                            onChange={e => handleChange('user', e.target.value)}
                            placeholder="user@gmail.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">
                            App-Passwort
                            {config.isConfigured && (
                                <span className="text-emerald-400 text-xs ml-2">(gespeichert & verschlüsselt)</span>
                            )}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={config.pass}
                                onChange={e => handleChange('pass', e.target.value)}
                                placeholder={config.isConfigured ? '••••••••' : 'App-Passwort eingeben'}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 pr-12 text-white focus:border-cyan-500 outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sender Identity */}
            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4">
                <h4 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                    <Mail size={16} /> Absender-Identität
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">Absender-Name</label>
                        <input
                            value={config.fromName}
                            onChange={e => handleChange('fromName', e.target.value)}
                            placeholder="HandyLand"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">Absender-E-Mail</label>
                        <input
                            value={config.fromEmail}
                            onChange={e => handleChange('fromEmail', e.target.value)}
                            placeholder="noreply@handyland.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none"
                        />
                        <p className="text-xs text-slate-600 mt-1">Bei Gmail muss dies mit dem SMTP-Benutzernamen übereinstimmen.</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-2">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/20"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                    {saving ? 'Speichern...' : 'Verschlüsselt speichern'}
                </button>
                <button
                    onClick={handleTest}
                    disabled={testing || !config.host || !config.user}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-3 rounded-xl font-bold transition-all"
                >
                    {testing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {testing ? 'Teste...' : 'Verbindung testen'}
                </button>
            </div>
        </div>
    );
};
