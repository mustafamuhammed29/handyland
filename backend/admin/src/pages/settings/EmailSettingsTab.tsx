import { Mail, Server, Shield } from 'lucide-react';

export const EmailSettingsTab = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-cyan-500/10 rounded-xl">
                    <Mail className="text-cyan-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">E-Mail Server (SendGrid)</h3>
                    <p className="text-slate-400 text-sm">
                        Verwalten Sie Ihren E-Mail-Versand (Bestellbestätigungen, Passwort-Reset usw.)
                    </p>
                </div>
            </div>

            {/* Note about Environment Variables */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-900/10 border border-blue-500/20">
                <Shield className="text-blue-400 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-blue-300 leading-relaxed font-bold">
                    SendGrid API Key is configured via environment variables on the server.
                </p>
            </div>

            {/* Read-only Info */}
            <div className="p-5 border border-slate-700 rounded-xl bg-slate-900/50 space-y-4 opacity-75">
                <h4 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                    <Server size={16} /> Server-Einstellungen (Gesperrt)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="smtp-host" className="block text-slate-400 text-sm font-bold mb-2">SMTP Host</label>
                        <input
                            id="smtp-host"
                            disabled
                            value="smtp.sendgrid.net"
                            title="SMTP Host"
                            aria-label="SMTP Host"
                            placeholder="smtp.sendgrid.net"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label htmlFor="smtp-port" className="block text-slate-400 text-sm font-bold mb-2">Port</label>
                        <input
                            id="smtp-port"
                            disabled
                            value="587"
                            title="SMTP Port"
                            aria-label="SMTP Port"
                            placeholder="587"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label htmlFor="smtp-username" className="block text-slate-400 text-sm font-bold mb-2">Benutzername</label>
                        <input
                            id="smtp-username"
                            disabled
                            value="apikey"
                            title="SMTP Benutzername"
                            aria-label="SMTP Benutzername"
                            placeholder="apikey"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label htmlFor="smtp-password" className="block text-slate-400 text-sm font-bold mb-2">Passwort / API Key</label>
                        <input
                            id="smtp-password"
                            disabled
                            value="Gesteuert durch SENDGRID_API_KEY in der .env-Datei"
                            title="Passwort / API Key"
                            aria-label="Passwort / API Key"
                            placeholder="Gesteuert durch SENDGRID_API_KEY in der .env-Datei"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-500 cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

