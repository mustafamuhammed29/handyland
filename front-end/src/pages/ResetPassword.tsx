import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, Loader, Eye, EyeOff, XCircle } from 'lucide-react';
import { authService } from '../services/authService';

import { ENV } from '../config/env';
const API_URL = ENV.API_URL;


const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [tokenValid, setTokenValid] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setTokenValid(false);
            setMessage('Invalid reset link');
        }
    }, [searchParams]);

    // Password strength checks
    const checks = {
        length: password.length >= 12,
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const strengthLabel = passed <= 1 ? 'Weak' : passed === 2 ? 'Fair' : passed === 3 ? 'Good' : 'Strong';
    const strengthColor = passed <= 1 ? 'bg-red-500' : passed === 2 ? 'bg-yellow-500' : passed === 3 ? 'bg-blue-500' : 'bg-emerald-500';
    const textColor = passed <= 1 ? 'text-red-400' : passed === 2 ? 'text-yellow-400' : passed === 3 ? 'text-blue-400' : 'text-emerald-400';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match');
            return;
        }
        if (password.length < 12) {
            setStatus('error');
            setMessage('Password must be at least 12 characters');
            return;
        }

        const token = searchParams.get('token');
        setStatus('loading');

        try {
            const data = await authService.resetPassword(token as string, password);

            if (data.success) {
                setStatus('success');
                setMessage(data.message);
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setStatus('error');
                setMessage(data.message || 'Error resetting password');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Error connecting to server');
        }
    };

    if (!tokenValid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Invalid Link</h2>
                        <p className="text-slate-400 mb-6">{message}</p>
                        <Link to="/forgot-password" className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors">
                            Request New Link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl shadow-2xl shadow-purple-900/50 mb-4">
                        <Lock className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2">Reset Password</h1>
                    <p className="text-slate-400">Enter your new password</p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    {status === 'success' ? (
                        <div className="text-center">
                            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-white mb-2">Password Reset!</h2>
                            <p className="text-slate-400 mb-4">{message}</p>
                            {/* Countdown visual */}
                            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                                <Loader className="w-4 h-4 animate-spin" />
                                Redirecting to login in 3 seconds...
                            </div>
                        </div>
                    ) : (
                        <>
                            {status === 'error' && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <p className="text-red-400 text-sm">{message}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required minLength={12}
                                            className="w-full pl-11 pr-11 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        />
                                        <button type="button" onClick={() => setShowPassword(v => !v)} aria-label="Toggle password"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {/* Strength Indicator */}
                                    {password.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden flex gap-1">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className={`h-full flex-1 rounded-full transition-all duration-300 ${i <= passed ? strengthColor : 'bg-slate-700'}`} />
                                                    ))}
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}>{strengthLabel}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1">
                                                {[
                                                    { ok: checks.length, label: '12+ characters' },
                                                    { ok: checks.upper, label: 'Uppercase' },
                                                    { ok: checks.number, label: 'Number' },
                                                    { ok: checks.special, label: 'Special char' },
                                                ].map(req => (
                                                    <div key={req.label} className={`flex items-center gap-1.5 text-[10px] ${req.ok ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                        {req.ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                        {req.label}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="w-full pl-11 pr-11 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        />
                                        <button type="button" onClick={() => setShowConfirmPassword(v => !v)} aria-label="Toggle confirm password"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {confirmPassword.length > 0 && (
                                        <div className={`flex items-center gap-1.5 mt-2 text-[10px] ${password === confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {password === confirmPassword
                                                ? <><CheckCircle className="w-3 h-3" />Passwords match</>
                                                : <><XCircle className="w-3 h-3" />Passwords do not match</>}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit" disabled={status === 'loading'}
                                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:from-purple-500 hover:to-pink-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {status === 'loading'
                                        ? <><Loader className="w-5 h-5 animate-spin" />Resetting...</>
                                        : 'Reset Password'}
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
                                <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">← Back to Login</Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
