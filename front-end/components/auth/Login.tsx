import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User as UserIcon, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AuthLayout } from './AuthLayout';
import { api } from '../../utils/api';

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters")
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
    const { login } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showResend, setShowResend] = useState(false);

    const { register, handleSubmit, formState: { errors }, watch } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    });

    // Watch email to allow resending verification
    const emailValue = watch("email");

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            await login(data.email, data.password);
            addToast("Login successful!", "success");
            // Navigation handled by authContext
        } catch (error: any) {
            console.error("Login Error", error);
            addToast(error.message || "Login failed", "error");
            if (error.message === 'Please verify your email first') {
                setShowResend(true);
            }
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!emailValue) {
            addToast('Please enter your email first', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await api.post('/auth/resend-verification', { email: emailValue });
            addToast('Verification email resent!', 'success');
            setShowResend(false);
        } catch (error: any) {
            addToast(error.message || 'Failed to resend verification', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Login"
            subtitle="System Access Protocol"
            icon={<UserIcon className="w-10 h-10 text-cyan-400" />}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1 animate-in slide-in-from-top-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Email</label>
                    <div className="relative group">
                        <UserIcon className="w-4 h-4 text-slate-500 absolute top-3.5 left-3 group-focus-within:text-cyan-400 transition-colors" />
                        <input
                            {...register("email")}
                            type="email"
                            className={`w-full pl-10 pr-4 py-3 bg-black/40 border ${errors.email ? 'border-red-500' : 'border-slate-800'} rounded-xl text-white focus:border-cyan-500 outline-none transition-all text-sm`}
                            placeholder="secure@handyland.com"
                        />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div className="space-y-1 animate-in slide-in-from-top-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Password</label>
                    <div className="relative group">
                        <Lock className="w-4 h-4 text-slate-500 absolute top-3.5 left-3 group-focus-within:text-cyan-400 transition-colors" />
                        <input
                            {...register("password")}
                            type="password"
                            className={`w-full pl-10 pr-4 py-3 bg-black/40 border ${errors.password ? 'border-red-500' : 'border-slate-800'} rounded-xl text-white focus:border-cyan-500 outline-none transition-all text-sm`}
                            placeholder="••••••••"
                        />
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-[10px] font-black text-slate-500 hover:text-cyan-400 uppercase tracking-widest transition-colors">
                        Lost Key?
                    </Link>
                </div>

                <button
                    disabled={isLoading}
                    type="submit"
                    className="w-full py-4 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 mt-4 uppercase tracking-widest bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                            Sign In
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center space-y-3">
                {showResend && (
                    <button
                        onClick={handleResend}
                        className="text-yellow-400 hover:text-yellow-300 font-bold text-xs uppercase tracking-widest block mx-auto animate-pulse"
                    >
                        Resend Verification Email
                    </button>
                )}
                <p className="text-slate-500 text-xs font-medium">
                    No account? {' '}
                    <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-black ml-1 uppercase">
                        Register
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};
