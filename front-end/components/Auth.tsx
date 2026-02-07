
import React, { useState } from 'react';
import { ViewState, LanguageCode, User } from '../types';
import { translations } from '../i18n';
import { User as UserIcon, Mail, Lock, ArrowRight, Loader2, Phone, MapPin, KeyRound, ChevronLeft, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

interface AuthProps {
    setView: (view: ViewState) => void;
    lang: LanguageCode;
    setUser: (user: User) => void;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'verify' | 'reset-verify' | 'reset-password';

// ... inside component ...
export const Auth: React.FC<AuthProps> = ({ setView, lang, setUser }) => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<AuthMode>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const t = translations[lang];
    const { addToast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: ''
    });

    const [tempToken, setTempToken] = useState('');

    const [otp, setOtp] = useState(['', '', '', '', '', '']);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value[0];
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'register' && formData.password !== formData.confirmPassword) {
            addToast(lang === 'ar' ? "كلمات المرور غير متطابقة" : "Passwords do not match", 'error');
            return;
        }

        setIsLoading(true);

        try {
            const API_URL = 'http://localhost:5000/api/auth';
            let endpoint = '';
            let body = {};

            if (mode === 'login') {
                endpoint = '/login';
                body = { email: formData.email, password: formData.password };
            } else if (mode === 'register') {
                endpoint = '/register';
                body = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    address: formData.address
                };
            } else if (mode === 'forgot') {
                endpoint = '/forgot-password'; // Check if this matches backend route
                body = { email: formData.email };
            }

            if (!endpoint) {
                // Handle text-only modes or other logic
                setIsLoading(false);
                return;
            }

            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (data.success) {
                if (mode === 'login') {
                    setUser(data.user);
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    addToast(`${t.welcomeBack}, ${data.user.name.split(' ')[0]}!`, 'success');
                    navigate('/dashboard');
                } else if (mode === 'register') {
                    addToast('Registration successful! Please check your email to verify.', 'success');
                    setMode('login'); // Switch to login view instead of fake verify
                } else if (mode === 'forgot') {
                    addToast('Password reset link sent to your email.', 'success');
                    setMode('login');
                }
            } else {
                addToast(data.message || 'Action failed', 'error');

                // Specific handling for unverified email
                if (mode === 'login' && data.message === 'Please verify your email first') {
                    setShowResend(true);
                    addToast('Please check your email to verify your account.', 'error');
                }
            }

        } catch (error) {
            console.error('Auth Error:', error);
            addToast('Connection Error. Please ensure backend is running.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const [showResend, setShowResend] = useState(false);

    const handleResend = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });
            const data = await res.json();
            if (data.success) {
                addToast('Verification email resent!', 'success');
                setShowResend(false);
            } else {
                addToast(data.message, 'error');
            }
        } catch (error) {
            addToast('Failed to connect to server', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen px-4 pt-24 pb-12 overflow-hidden bg-slate-900">
            {/* Animated Binary Code Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-lg perspective-container z-10">
                <div className="glass-modern rounded-[2.5rem] p-8 md:p-10 border border-slate-700/50 shadow-2xl relative overflow-hidden bg-slate-900/40 backdrop-blur-2xl">

                    {/* Scanner Effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-40 animate-[scan_3s_linear_infinite]"></div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-700 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] group">
                            {mode === 'login' && <UserIcon className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />}
                            {mode === 'register' && <ShieldCheck className="w-10 h-10 text-emerald-400 group-hover:scale-110 transition-transform" />}
                            {mode === 'forgot' && <KeyRound className="w-10 h-10 text-yellow-400 group-hover:rotate-12 transition-transform" />}
                            {(mode === 'verify' || mode === 'reset-verify') && <Lock className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />}
                            {mode === 'reset-password' && <ShieldCheck className="w-10 h-10 text-emerald-400 group-hover:scale-110 transition-transform" />}
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                            {mode === 'login' ? t.login :
                                mode === 'register' ? t.register :
                                    mode === 'verify' ? 'Verification' :
                                        mode === 'reset-verify' ? 'Verification' :
                                            mode === 'reset-password' ? (lang === 'ar' ? 'كلمة سر جديدة' : 'New Password') :
                                                (lang === 'ar' ? 'استعادة الرمز' : 'Recovery')}
                        </h2>
                        <p className="text-slate-500 text-xs mt-2 font-mono tracking-widest uppercase">
                            {(mode === 'verify' || mode === 'reset-verify') ? 'Enter Security Code' :
                                mode === 'reset-password' ? 'Create New Password' :
                                    'System Access Protocol'}
                        </p>
                    </div>

                    {/* No success screen, go directly to OTP */}
                    {false ? null : (
                        <form className="space-y-4" onSubmit={handleAuth}>
                            {/* REGISTER INPUTS */}
                            {mode === 'register' && (
                                <div className="grid md:grid-cols-2 gap-4 animate-in slide-in-from-top-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">{t.fullName}</label>
                                        <div className="relative group">
                                            <UserIcon className="w-4 h-4 text-slate-500 absolute top-3.5 left-3 group-focus-within:text-cyan-400 transition-colors" />
                                            <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 bg-black/40 border border-slate-800 rounded-xl text-white focus:border-cyan-500 outline-none transition-all text-sm" placeholder="e.g. Mark Tech" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">{lang === 'ar' ? 'الهاتف' : 'Phone'}</label>
                                        <div className="relative group">
                                            <Phone className="w-4 h-4 text-slate-500 absolute top-3.5 left-3 group-focus-within:text-cyan-400 transition-colors" />
                                            <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 bg-black/40 border border-slate-800 rounded-xl text-white focus:border-cyan-500 outline-none transition-all text-sm" placeholder="+49..." />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">{lang === 'ar' ? 'العنوان' : 'Location'}</label>
                                        <div className="relative group">
                                            <MapPin className="w-4 h-4 text-slate-500 absolute top-3.5 left-3 group-focus-within:text-cyan-400 transition-colors" />
                                            <input type="text" name="address" required value={formData.address} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 bg-black/40 border border-slate-800 rounded-xl text-white focus:border-cyan-500 outline-none transition-all text-sm" placeholder="Berlin, Germany" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* COMMON INPUTS (Email & Password) */}
                            {mode !== 'verify' && (
                                <>
                                    <div className="space-y-1 animate-in slide-in-from-top-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">{t.email}</label>
                                        <div className="relative group">
                                            <Mail className="w-4 h-4 text-slate-500 absolute top-3.5 left-3 group-focus-within:text-cyan-400 transition-colors" />
                                            <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 bg-black/40 border border-slate-800 rounded-xl text-white focus:border-cyan-500 outline-none transition-all text-sm" placeholder="secure@handyland.com" />
                                        </div>
                                    </div>

                                    {(mode === 'login' || mode === 'register' || mode === 'reset-password') && (
                                        <div className={`grid ${mode === 'register' || mode === 'reset-password' ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4 animate-in slide-in-from-top-4`}>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">{mode === 'reset-password' ? 'New Password' : t.password}</label>
                                                <div className="relative group">
                                                    <Lock className="w-4 h-4 text-slate-500 absolute top-3.5 left-3 group-focus-within:text-cyan-400 transition-colors" />
                                                    <input type="password" name="password" required value={formData.password} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 bg-black/40 border border-slate-800 rounded-xl text-white focus:border-cyan-500 outline-none transition-all text-sm" placeholder="••••••••" />
                                                </div>
                                            </div>
                                            {(mode === 'register' || mode === 'reset-password') && (
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">{lang === 'ar' ? 'تأكيد الرمز' : 'Confirm'}</label>
                                                    <div className="relative group">
                                                        <Lock className="w-4 h-4 text-slate-500 absolute top-3.5 left-3 group-focus-within:text-cyan-400 transition-colors" />
                                                        <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 bg-black/40 border border-slate-800 rounded-xl text-white focus:border-cyan-500 outline-none transition-all text-sm" placeholder="••••••••" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* VERIFY / OTP MODE */}
                            {(mode === 'verify' || mode === 'reset-verify') && (
                                <div className="space-y-6 animate-in zoom-in">
                                    <div className="text-center text-sm text-slate-400">
                                        {mode === 'verify' ? 'We sent a code to' : 'Reset code sent to'} <span className="text-white font-bold">{formData.email}</span>
                                    </div>
                                    <div className="flex justify-center gap-2">
                                        {otp.map((digit, i) => (
                                            <input
                                                key={i}
                                                id={`otp-${i}`}
                                                type="text"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                                className="w-12 h-14 bg-black/50 border border-slate-700 rounded-xl text-center text-2xl font-bold text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                                            />
                                        ))}
                                    </div>
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            className="text-xs text-slate-500 hover:text-cyan-400 flex items-center justify-center gap-2 mx-auto transition-colors"
                                        >
                                            <RefreshCw className="w-3 h-3" /> Resend Code
                                        </button>
                                    </div>
                                </div>
                            )}

                            {mode === 'login' && (
                                <div className="flex justify-end">
                                    <button type="button" onClick={() => setMode('forgot')} className="text-[10px] font-black text-slate-500 hover:text-cyan-400 uppercase tracking-widest transition-colors">
                                        {lang === 'ar' ? 'فقدت الرمز؟' : 'Lost Key?'}
                                    </button>
                                </div>
                            )}

                            <button
                                disabled={isLoading}
                                className={`w-full py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 mt-4 uppercase tracking-widest ${mode === 'register' ? 'bg-gradient-to-r from-emerald-600 to-cyan-600' : 'bg-gradient-to-r from-cyan-600 to-blue-600'
                                    }`}
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        {mode === 'login' ? t.signIn :
                                            mode === 'register' ? t.register :
                                                mode === 'verify' ? 'Confirm Identity' :
                                                    mode === 'reset-verify' ? 'Verify Code' :
                                                        mode === 'reset-password' ? 'Reset Password' :
                                                            (lang === 'ar' ? 'إرسال طلب الاستعادة' : 'Initialize')}
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-800/50 text-center space-y-4">
                        {mode !== 'login' && (
                            <button onClick={() => setMode('login')} className="text-slate-500 hover:text-white text-[10px] font-black flex items-center justify-center gap-2 mx-auto transition-colors uppercase tracking-widest">
                                <ChevronLeft className="w-4 h-4" /> {lang === 'ar' ? 'العودة' : 'Return to Core'}
                            </button>
                        )}
                        {mode === 'login' && (
                            <div className="space-y-3">
                                {showResend && (
                                    <button
                                        onClick={handleResend}
                                        className="text-yellow-400 hover:text-yellow-300 font-bold text-xs uppercase tracking-widest block mx-auto animate-pulse"
                                    >
                                        Resend Verification Email
                                    </button>
                                )}
                                <p className="text-slate-500 text-xs font-medium">
                                    {t.noAccount} {' '}
                                    <button onClick={() => setMode('register')} className="text-cyan-400 hover:text-cyan-300 font-black ml-1 uppercase">
                                        {t.register}
                                    </button>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
