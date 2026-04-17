import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader, AlertTriangle, Mail, ShieldOff } from 'lucide-react';

const ERROR_MESSAGES: Record<string, { title: string; description: string; action?: { label: string; href: string } }> = {
    email_exists: {
        title: 'E-Mail bereits registriert',
        description: 'Diese E-Mail-Adresse ist bereits mit einem Passwort-Konto verknüpft. Bitte melde dich direkt mit deinem Passwort an.',
        action: { label: 'Mit Passwort anmelden →', href: '/login' }
    },
    account_suspended: {
        title: 'Konto gesperrt',
        description: 'Dein Konto wurde von der Administration gesperrt. Bitte wende dich an unseren Support.',
        action: { label: 'Support kontaktieren', href: 'mailto:support@handyland.com' }
    },
    oauth_denied: {
        title: 'Zugriff abgelehnt',
        description: 'Du hast die Anmeldung über Google/Facebook abgebrochen. Du kannst es jederzeit erneut versuchen.',
        action: { label: 'Zurück zum Login', href: '/login' }
    },
    social_auth_failed: {
        title: 'Anmeldung fehlgeschlagen',
        description: 'Bei der Anmeldung über Google/Facebook ist ein Fehler aufgetreten. Bitte versuche es erneut oder melde dich mit deinem Passwort an.',
        action: { label: 'Zurück zum Login', href: '/login' }
    }
};

/**
 * Landing page for social OAuth redirect.
 * Backend redirects here with ?token=<accessToken> after Google/Facebook auth.
 * Enhanced to show specific, actionable error messages per failure code.
 */
const SocialAuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loginWithToken } = useAuth() as any;
    const [errorCode, setErrorCode] = useState<string | null>(null);

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error || !token) {
            const code = error && ERROR_MESSAGES[error] ? error : 'social_auth_failed';
            setErrorCode(code);
            return;
        }

        if (typeof loginWithToken === 'function') {
            loginWithToken(token)
                .then(() => navigate('/', { replace: true }))
                .catch((err: any) => {
                    const code = err?.code || err?.response?.data?.code || 'social_auth_failed';
                    setErrorCode(ERROR_MESSAGES[code] ? code : 'social_auth_failed');
                });
        } else {
            navigate('/', { replace: true });
        }
    }, [searchParams, navigate, loginWithToken]);

    if (errorCode) {
        const info = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.social_auth_failed;
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        {errorCode === 'account_suspended' ? (
                            <ShieldOff className="w-8 h-8 text-red-400" />
                        ) : errorCode === 'email_exists' ? (
                            <Mail className="w-8 h-8 text-orange-400" />
                        ) : (
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        )}
                    </div>
                    <h2 className="text-xl font-black text-white mb-3 tracking-tight">{info.title}</h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">{info.description}</p>
                    {info.action && (
                        <a
                            href={info.action.href}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm"
                        >
                            {info.action.label}
                        </a>
                    )}
                    <div className="mt-4">
                        <Link to="/" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
                            Zur Startseite →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Loader className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
                <p className="text-white text-lg font-semibold">Anmeldung wird abgeschlossen...</p>
                <p className="text-slate-400 text-sm mt-2">Bitte einen Moment warten</p>
            </div>
        </div>
    );
};

export default SocialAuthCallback;
