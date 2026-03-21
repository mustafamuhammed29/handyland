import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, ShieldCheck, ArrowRight, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    // For local UI validation before hitting the backend
    const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
    
    const navigate = useNavigate();
    const { login, loading } = useAuth();

    const validateForm = () => {
        const errors: { email?: string; password?: string } = {};
        if (!email) {
            errors.email = 'Email address is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = 'Please enter a valid email address';
        }
        
        if (!password) {
            errors.password = 'Password is required';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!validateForm()) return;
        
        try {
            await login(email, password);
            navigate('/', { replace: true });
        } catch (err: any) {
            // Enhanced error message
            setError(err.message || 'Invalid credentials or access denied. Please try again.');
            console.error('Login error:', err);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/grain.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[420px] relative z-10"
            >
                {/* Logo Section */}
                <div className="text-center mb-10">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5, type: 'spring', bounce: 0.4 }}
                        className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] mb-6 ring-1 ring-white/5"
                    >
                        <ShieldCheck className="w-10 h-10 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-slate-400 text-sm">Sign in to HandyLand Admin Console</p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                    
                    <div className="p-8 relative">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                    className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 overflow-hidden"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-200 leading-snug">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleLogin} className="space-y-5" noValidate>
                            {/* Email Input */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-300 ml-1">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className={`w-5 h-5 transition-colors duration-300 ${validationErrors.email ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`} />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (validationErrors.email) setValidationErrors({...validationErrors, email: undefined});
                                        }}
                                        className={`w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border ${validationErrors.email ? 'border-red-500/50' : 'border-slate-800'} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all`}
                                        placeholder="admin@handyland.com"
                                    />
                                </div>
                                <AnimatePresence>
                                    {validationErrors.email && (
                                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-400 ml-1">
                                            {validationErrors.email}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-1.5 pt-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-sm font-medium text-slate-300">
                                        Password
                                    </label>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className={`w-5 h-5 transition-colors duration-300 ${validationErrors.password ? 'text-red-400' : 'text-slate-500 group-focus-within:text-blue-400'}`} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (validationErrors.password) setValidationErrors({...validationErrors, password: undefined});
                                        }}
                                        className={`w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border ${validationErrors.password ? 'border-red-500/50' : 'border-slate-800'} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all`}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <AnimatePresence>
                                    {validationErrors.password && (
                                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-400 ml-1">
                                            {validationErrors.password}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Login Button */}
                            <div className="pt-6">
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                    <span className="relative flex items-center justify-center gap-2">
                                        {loading ? (
                                            <>
                                                <Activity className="w-5 h-5 animate-pulse" />
                                                Authenticating...
                                            </>
                                        ) : (
                                            <>
                                                Sign In securely
                                                <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </motion.button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 space-y-2">
                    <p className="text-slate-500 text-xs flex items-center justify-center gap-1.5">
                        <Lock className="w-3 h-3" />
                        End-to-end encrypted session
                    </p>
                    <p className="text-slate-600/50 text-xs">
                        HandyLand © {new Date().getFullYear()}
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
