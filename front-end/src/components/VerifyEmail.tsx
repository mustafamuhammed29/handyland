import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';

export const VerifyEmail = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar' || i18n.language === 'fa';
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Extract token from any possible query parameter (token, token_hash, code) or URL hash
    const token = searchParams.get('token') || searchParams.get('token_hash') || searchParams.get('code');
    const hash = window.location.hash;
    const isHashConfirmed = hash.includes('access_token=') || hash.includes('type=signup') || hash.includes('type=email_change');
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState(t('verifyEmail.verifyingMessage', 'Bitte warten Sie einen Moment.'));
    const hasAttempted = React.useRef(false);

    useEffect(() => {
        if (hasAttempted.current) return;
        hasAttempted.current = true;

        // If Supabase redirected directly with access_token in URL hash, email is already verified!
        if (isHashConfirmed) {
            const hashToken = hash.match(/access_token=([^&]+)/)?.[1] || token;
            if (hashToken) {
                authService.verifyEmail(hashToken).catch(() => {});
            }
            setStatus('success');
            setMessage(t('verifyEmail.successMessage', 'Ihre E-Mail-Adresse wurde verifiziert.'));
            setTimeout(() => navigate('/login'), 2500);
            return;
        }

        if (!token) {
            setStatus('error');
            setMessage(t('verifyEmail.errorMessage', 'Der Bestätigungslink ist ungültig oder abgelaufen.'));
            return;
        }

        const verify = async () => {
            try {
                const response = await authService.verifyEmail(token);
                setStatus('success');
                setMessage(response.message || t('verifyEmail.successMessage', 'Ihre E-Mail-Adresse wurde verifiziert.'));
                setTimeout(() => navigate('/login'), 2500);
            } catch (error: any) {
                const errorMessage = error.message || t('verifyEmail.errorMessage', 'Der Bestätigungslink ist ungültig oder abgelaufen.');
                if (errorMessage.toLowerCase().includes('already verified') || errorMessage.toLowerCase().includes('bereits') || errorMessage.toLowerCase().includes('verarbeitet')) {
                    setStatus('success');
                    setMessage(t('verifyEmail.alreadyVerified', 'E-Mail ist bereits bestätigt. Du kannst dich jetzt anmelden.'));
                    setTimeout(() => navigate('/login'), 2500);
                } else {
                    setStatus('error');
                    setMessage(errorMessage);
                }
            }
        };

        verify();
    }, [token, isHashConfirmed, navigate, t]);

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl">
                {/* Background Glow */}
                <div className={`absolute top-0 left-0 w-full h-1 ${status === 'loading' ? 'bg-blue-500 animate-pulse' :
                    status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}></div>

                <div className="mb-6 flex justify-center">
                    {status === 'loading' && <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />}
                    {status === 'success' && <CheckCircle2 className="w-16 h-16 text-emerald-500" />}
                    {status === 'error' && <XCircle className="w-16 h-16 text-red-500" />}
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {status === 'loading' ? t('verifyEmail.verifyingTitle', 'E-Mail wird überprüft...') :
                        status === 'success' ? t('verifyEmail.successTitle', 'E-Mail erfolgreich bestätigt!') :
                        t('verifyEmail.errorTitle', 'Verifizierung fehlgeschlagen')}
                </h2>

                <p className="text-slate-500 dark:text-slate-400 mb-8">{message}</p>

                {status !== 'loading' && (
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-3 bg-gradient-to-r from-brand-secondary to-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 transition-all flex items-center justify-center gap-2"
                        >
                            {t('verifyEmail.goToLogin', 'Zum Login')} {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                        </button>
                        {status === 'error' && (
                            <>
                                <button
                                    onClick={() => navigate('/forgot-password')}
                                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl text-sm font-semibold transition-colors"
                                >
                                    {t('verifyEmail.requestNewLink', 'Neuen Link anfordern')}
                                </button>
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full py-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold transition-colors"
                                >
                                    {t('verifyEmail.returnHome', 'Zurück zur Startseite')}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
