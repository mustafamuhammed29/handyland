import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';

export const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Extract token from any possible query parameter (token, token_hash, code) or URL hash
    const token = searchParams.get('token') || searchParams.get('token_hash') || searchParams.get('code');
    const hash = window.location.hash;
    const isHashConfirmed = hash.includes('access_token=') || hash.includes('type=signup') || hash.includes('type=email_change');
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('E-Mail wird überprüft...');
    const hasAttempted = React.useRef(false);

    useEffect(() => {
        if (hasAttempted.current) return;
        hasAttempted.current = true;

        // If Supabase redirected directly with access_token in URL hash, email is already verified!
        if (isHashConfirmed) {
            const hashToken = hash.match(/access_token=([^&]+)/)?.[1] || token;
            if (hashToken) {
                authService.verifyEmail(hashToken).catch(() => {});
            }
            setStatus('success');
            setMessage('E-Mail erfolgreich bestätigt! Du wirst zum Login weitergeleitet...');
            setTimeout(() => navigate('/login'), 2500);
            return;
        }

        if (!token) {
            setStatus('error');
            setMessage('Ungültiger oder abgelaufener Bestätigungslink.');
            return;
        }

        const verify = async () => {
            try {
                const response = await authService.verifyEmail(token);
                setStatus('success');
                setMessage(response.message || 'E-Mail erfolgreich bestätigt!');
                setTimeout(() => navigate('/login'), 2500);
            } catch (error: any) {
                const errorMessage = error.message || 'Bestätigung fehlgeschlagen. Der Link ist möglicherweise abgelaufen.';
                if (errorMessage.toLowerCase().includes('already verified') || errorMessage.toLowerCase().includes('bereits') || errorMessage.toLowerCase().includes('verarbeitet')) {
                    setStatus('success');
                    setMessage('E-Mail ist bereits bestätigt. Du kannst dich jetzt anmelden.');
                    setTimeout(() => navigate('/login'), 2500);
                } else {
                    setStatus('error');
                    setMessage(errorMessage);
                }
            }
        };

        verify();
    }, [token, isHashConfirmed, navigate]);

    return (
        <div className="min-h-[100dvh] bg-slate-950 flex items-center justify-center p-4">
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
