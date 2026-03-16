import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react';
import { validateEmail, validateRequired } from '../validation';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { authService } from '../services/authService';
import { useTranslation } from 'react-i18next';

import { ENV } from '../config/env';
const API_URL = ENV.API_URL;

const SocialButton: React.FC<{ provider: 'google' | 'facebook'; disabled?: boolean }> = ({ provider, disabled }) => {
    const isGoogle = provider === 'google';
    const label = isGoogle ? 'Continue with Google' : 'Continue with Facebook';
    const bg = isGoogle ? 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300' : 'bg-[#1877F2] hover:bg-[#166FE5] text-white';
    const href = `${API_URL}/api/auth/${provider}`;

    return (
        <a
            href={href}
            aria-label={label}
            className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-semibold transition-all ${bg} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
            {isGoogle ? (
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
            ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            )}
            {label}
        </a>
    );
};

const Login: React.FC = () => {
    const { login } = useAuth();
    const { settings } = useSettings();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showResend, setShowResend] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const location = useLocation();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setShowResend(false);
        setResendSuccess(false);

        if (!validateRequired(email)) { setError('Email is required'); return; }
        if (!validateEmail(email)) { setError('Please enter a valid email address'); return; }
        if (!validateRequired(password)) { setError('Password is required'); return; }

        setLoading(true);
        try {
            const redirectPath = location.state?.from?.pathname;
            await login(email, password, redirectPath);
        } catch (err: any) {
            const errorMessage = err.message || 'Invalid email or password';
            setError(errorMessage);
            if (errorMessage.toLowerCase().includes('verify') || (err.data && err.data.isVerified === false)) {
                setShowResend(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        try {
            const data = await authService.resendVerification(email);
            if (data.success) {
                setError('');
                setResendSuccess(true);
                setShowResend(false);
            } else {
                setError(data.message);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to resend email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center pt-32 p-4 pb-12">
            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl shadow-2xl shadow-blue-900/50 mb-4">
                        <Lock className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2">{t('auth.loginTitle', 'Welcome Back')}</h1>
                    <p className="text-slate-400 uppercase tracking-wider text-sm">HandyLand User Portal</p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6">Login to Your Account</h2>

                    {/* Success Message */}
                    {resendSuccess && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
                            ✅ Verification email sent! Please check your inbox.
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex flex-col items-start gap-3">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                            {showResend && (
                                <button
                                    onClick={handleResend}
                                    disabled={loading}
                                    className="text-xs text-blue-400 hover:text-blue-300 underline font-semibold ml-8 disabled:opacity-50"
                                >
                                    Resend Verification Email
                                </button>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {t('auth.emailLabel', 'Email Address')}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {t('auth.passwordLabel', 'Password')}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-11 pr-11 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password */}
                        <div className="flex justify-end">
                            <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-bold rounded-lg shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:from-brand-secondary/90 hover:to-brand-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <><Loader className="w-5 h-5 animate-spin" />Logging in...</> : 'Login to HandyLand'}
                        </button>
                    </form>

                    {/* Social Login */}
                    {(settings.socialAuth?.google || settings.socialAuth?.facebook) && (
                        <>
                            <div className="my-6 flex items-center gap-3">
                                <div className="flex-1 h-px bg-slate-700" />
                                <span className="text-slate-500 text-xs uppercase tracking-wider">or continue with</span>
                                <div className="flex-1 h-px bg-slate-700" />
                            </div>

                            <div className="space-y-3">
                                {settings.socialAuth?.google && <SocialButton provider="google" />}
                                {settings.socialAuth?.facebook && <SocialButton provider="facebook" />}
                            </div>
                        </>
                    )}

                    {/* Register Link */}
                    <div className="mt-6 pt-6 border-t border-slate-800">
                        <p className="text-center text-slate-400 text-sm">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-slate-500 text-sm mt-6">Protected User Area • HandyLand © 2025</p>
            </div>
        </div>
    );
};

export default Login;
