import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle, Loader } from 'lucide-react';

import { ENV } from './src/config/env';
const API_URL = ENV.API_URL;

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setStatus('success');
                setMessage(data.message);
                setEmail('');
            } else {
                setStatus('error');
                setMessage(data.message || 'Error sending reset email');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Error connecting to server');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl shadow-2xl shadow-purple-900/50 mb-4">
                        <Mail className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2">Forgot Password?</h1>
                    <p className="text-slate-400">We'll send you a reset link</p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    {status === 'success' ? (
                        <div className="text-center">
                            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-white mb-2">Email Sent!</h2>
                            <p className="text-slate-400 mb-6">{message}</p>
                            <Link
                                to="/login"
                                className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors"
                            >
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-300 mb-6 text-center">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

                            {status === 'error' && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <p className="text-red-400 text-sm">{message}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-lg shadow-lg hover:from-purple-500 hover:to-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
                                <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                                    ← Back to Login
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
