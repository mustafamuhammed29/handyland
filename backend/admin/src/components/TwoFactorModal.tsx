import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, AlertCircle, Loader2, KeyRound, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    isOpen: boolean;
    onSuccess: () => void;
}

export const TwoFactorModal: React.FC<Props> = ({ isOpen, onSuccess }) => {
    const { verify2FA, cancel2FA, twoFactorChallenge } = useAuth();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const inputRef = useRef<HTMLInputElement>(null);

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
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setError('The authentication challenge has expired. Please log in again.');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isOpen, timeLeft]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    if (!isOpen || !twoFactorChallenge) return null;

    const handleCancel = async () => {
        await cancel2FA();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = otp.trim();
        if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
            setError('Please enter a valid 6-digit numeric verification code.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await verify2FA(trimmed);
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Invalid 2FA code. Please try again.');
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-2fa-title"
                tabIndex={-1}
                className="bg-slate-900 border border-slate-700/60 rounded-3xl w-full max-w-md p-8 shadow-2xl relative text-white outline-none"
            >
                {/* Close Button */}
                <button
                    onClick={handleCancel}
                    className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-blue-500/20 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]">
                        <ShieldCheck className="w-9 h-9" />
                    </div>
                    <h3 id="admin-2fa-title" className="text-2xl font-bold tracking-tight">Admin 2FA Verification</h3>
                    <p className="text-sm text-slate-400 mt-1.5">
                        Enter the 6-digit code from your authenticator app to access the Admin Console.
                    </p>
                </div>

                {/* Error Banner */}
                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-300 text-sm"
                        >
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                            Security Token
                        </label>
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
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
                                placeholder="000000"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-center text-2xl tracking-[0.35em] font-mono text-white placeholder-slate-600 outline-none transition shadow-inner"
                                disabled={loading || timeLeft <= 0}
                                required
                            />
                        </div>
                    </div>

                    {/* Expiry Timer */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <span>Challenge expires in:</span>
                        <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-amber-400' : 'text-slate-300'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 space-y-2.5">
                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6 || timeLeft <= 0}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Verifying Token...</span>
                                </>
                            ) : (
                                <>
                                    <span>Authenticate & Proceed</span>
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
                            Cancel
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
