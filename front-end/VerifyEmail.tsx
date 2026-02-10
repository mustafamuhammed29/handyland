import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react';

import { ENV } from './src/config/env';
const API_URL = ENV.API_URL;

const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/auth/verify-email/${token}`, {
                    method: 'GET',
                });

                const data = await response.json();

                if (data.success) {
                    setStatus('success');
                    setMessage(data.message);

                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Verification failed');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Error connecting to server');
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
                    {status === 'loading' && (
                        <>
                            <Loader className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
                            <h2 className="text-2xl font-bold text-white mb-2">Verifying Email...</h2>
                            <p className="text-slate-400">Please wait while we verify your email address</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
                            <p className="text-slate-400 mb-4">{message}</p>
                            <p className="text-sm text-slate-500">Redirecting to login...</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
                            <p className="text-slate-400 mb-6">{message}</p>
                            <Link
                                to="/login"
                                className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors"
                            >
                                Go to Login
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
