import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, AlertCircle, Loader2, KeyRound, ArrowRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const TwoFactorChallengeModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { verify2FA, cancel2FA, twoFactorChallenge } = useAuth();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const inputRef = useRef<HTMLInputElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    const handleCancel = async () => {
        await cancel2FA();
        onClose();
    };

    useDialogAccessibility({
        isOpen: isOpen && !!twoFactorChallenge,
        onClose: handleCancel,
        dialogRef,
        initialFocusRef: inputRef
    });

    useEffect(() => {
        if (isOpen) {
            setOtp('');
            setError(null);
            setTimeLeft(300);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setError(t('auth.2fa_expired', 'Der Bestätigungscode ist abgelaufen. Bitte melden Sie sich erneut an.'));
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isOpen, timeLeft, t]);

    if (!isOpen || !twoFactorChallenge) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = otp.trim();
        if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
            setError(t('auth.2fa_invalid_format', 'Bitte geben Sie einen 6-stelligen Zahlencode ein.'));
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await verify2FA(trimmed);
            onClose();
        } catch (err: any) {
            const msg = err.message || t('auth.2fa_failed', 'Ungültiger Authentifizierungscode. Bitte versuchen Sie es erneut.');
            setError(msg);
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="twofactor-modal-title"
                tabIndex={-1}
                className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-white outline-none"
            >
                {/* Close / Cancel Button */}
                <button
                    onClick={handleCancel}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                    aria-label={t('common.close', 'Schließen')}
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h3 id="twofactor-modal-title" className="text-xl font-bold">{t('auth.2fa_title', 'Zwei-Faktor-Authentifizierung')}</h3>
                    <p className="text-sm text-slate-400 mt-1">
                        {t('auth.2fa_description', 'Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein.')}
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-red-300 text-sm">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                            {t('auth.2fa_code_label', 'Sicherheitscode')}
                        </label>
                        <div className="relative">
                            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                ref={inputRef}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setOtp(val);
                                    if (error) setError(null);
                                }}
                                placeholder="123456"
                                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-center text-2xl tracking-[0.3em] font-mono text-white placeholder-slate-600 outline-none transition"
                                disabled={loading || timeLeft <= 0}
                                required
                            />
                        </div>
                    </div>

                    {/* Expiry Timer */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <span>{t('auth.2fa_valid_for', 'Gültig für:')}</span>
                        <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-amber-400' : 'text-slate-300'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 space-y-2">
                        <button
                            type={t('submit')}
                            disabled={loading || otp.length !== 6 || timeLeft <= 0}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>{t('auth.verifying', 'Überprüfen...')}</span>
                                </>
                            ) : (
                                <>
                                    <span>{t('auth.verify_and_login', 'Bestätigen & Anmelden')}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={loading}
                            className="w-full py-2.5 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white text-sm font-medium rounded-xl transition"
                        >
                            {t('common.cancel', 'Abbrechen')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
