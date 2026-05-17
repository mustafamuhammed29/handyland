import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { authService } from '../services/authService';

const ForgotPassword: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const data = await authService.forgotPassword(email);

            if (data.success) {
                setStatus('success');
                setMessage(data.message);
                setEmail('');
            } else {
                setStatus('error');
                setMessage(data.message || t('forgotPassword.errorSending', 'Fehler beim Senden der E-Mail'));
            }
        } catch (error) {
            setStatus('error');
            setMessage(t('forgotPassword.errorServer', 'Verbindungsfehler zum Server'));
        }
    };

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-gradient-to-br from-purple-600 to-brand-secondary rounded-2xl shadow-2xl shadow-purple-900/50 mb-4">
                        <Mail className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
                        {t('forgotPassword.title', 'Passwort vergessen?')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {t('forgotPassword.subtitle', 'Wir senden Ihnen einen Link zum Zurücksetzen')}
                    </p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl">
                    {status === 'success' ? (
                        <div className="text-center">
                            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                {t('forgotPassword.emailSent', 'E-Mail gesendet!')}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">{message}</p>
                            <Link
                                to="/login"
                                className="inline-block px-6 py-3 bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-semibold rounded-lg hover:from-brand-secondary/90 hover:to-brand-primary/90 transition-all shadow-lg shadow-brand-primary/25"
                            >
                                {t('forgotPassword.backToLogin', 'Zurück zum Login')}
                            </Link>
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-700 dark:text-slate-300 mb-6 text-center">
                                {t('forgotPassword.description', 'Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.')}
                            </p>

                            {status === 'error' && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <p className="text-red-400 text-sm">{message}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        {t('forgotPassword.emailLabel', 'E-Mail-Adresse')}
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full py-3 bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-bold rounded-lg shadow-lg shadow-brand-primary/25 hover:from-brand-secondary/90 hover:to-brand-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            {t('forgotPassword.sending', 'Wird gesendet...')}
                                        </>
                                    ) : (
                                        t('forgotPassword.sendLink', 'Link zum Zurücksetzen senden')
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
                                <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                                    ← {t('forgotPassword.backToLogin', 'Zurück zum Login')}
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
