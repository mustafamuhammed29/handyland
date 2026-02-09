import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../utils/api';

export const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verify = async () => {
            try {
                // Call actual API
                const response = await api.get<{ message: string }>(`/api/auth/verify-email/${token}`);
                setStatus('success');
                setMessage(response.message || 'Email verified successfully!');
                setTimeout(() => navigate('/login'), 3000); // Redirect to login
            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || 'Verification failed. Link may be expired.');
            }
        };

        verify();
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden">
                {/* Background Glow */}
                <div className={`absolute top-0 left-0 w-full h-1 ${status === 'loading' ? 'bg-blue-500 animate-pulse' :
                    status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}></div>

                <div className="mb-6 flex justify-center">
                    {status === 'loading' && <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />}
                    {status === 'success' && <CheckCircle2 className="w-16 h-16 text-emerald-500" />}
                    {status === 'error' && <XCircle className="w-16 h-16 text-red-500" />}
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                    {status === 'loading' ? 'Verifying...' :
                        status === 'success' ? 'Verified!' : 'Verification Failed'}
                </h2>

                <p className="text-slate-400 mb-8">{message}</p>

                {status !== 'loading' && (
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        Go to Login <ArrowRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};
