import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const { addToast } = useToast();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            addToast("Passwords do not match", 'error');
            return;
        }

        if (!token) {
            addToast("Invalid reset token", 'error');
            return;
        }

        setIsLoading(true);

        // Mock Reset Password
        setTimeout(() => {
            addToast('Password reset successfully (Mock)', 'success');
            setIsLoading(false);
            setTimeout(() => navigate('/'), 2000);
        }, 1500);
    };

    if (!token) return <div className="text-white text-center pt-20">Invalid Token</div>;

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full relative overflow-hidden">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
                        <KeyRound className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Reset Password</h2>
                    <p className="text-slate-500 text-sm mt-1">Enter your new secure password</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">New Password</label>
                        <div className="relative group">
                            <Lock className="w-4 h-4 text-slate-500 absolute top-3.5 left-3 group-focus-within:text-yellow-400 transition-colors" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-slate-800 rounded-xl text-white focus:border-yellow-500 outline-none transition-all text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Confirm Password</label>
                        <div className="relative group">
                            <Lock className="w-4 h-4 text-slate-500 absolute top-3.5 left-3 group-focus-within:text-yellow-400 transition-colors" />
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-slate-800 rounded-xl text-white focus:border-yellow-500 outline-none transition-all text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        disabled={isLoading}
                        className="w-full py-4 rounded-xl font-bold text-black bg-yellow-400 hover:bg-yellow-300 shadow-lg shadow-yellow-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 mt-6"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                Reset Password <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
