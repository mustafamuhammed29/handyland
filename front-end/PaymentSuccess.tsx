import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader, AlertCircle, ArrowRight } from 'lucide-react';
import { useCart } from './context/CartContext';

const PaymentSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const navigate = useNavigate();
    const { clearCart } = useCart();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying payment...');

    useEffect(() => {
        if (!sessionId) {
            setStatus('error');
            setMessage('No session ID found.');
            return;
        }

        const verifyPayment = async () => {
            try {
                const token = localStorage.getItem('userToken');
                const response = await fetch(`http://localhost:5000/api/payment/success`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ sessionId })
                });

                const data = await response.json();

                if (data.success) {
                    setStatus('success');
                    clearCart();
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Payment verification failed.');
                }
            } catch (error) {
                console.error('Payment verification error:', error);
                setStatus('error');
                setMessage('Error connecting to server.');
            }
        };

        verifyPayment();
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">

                {status === 'loading' && (
                    <div className="py-12">
                        <Loader className="w-16 h-16 text-cyan-500 animate-spin mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">Processing Payment</h2>
                        <p className="text-slate-400">Please wait while we confirm your transaction...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <CheckCircle className="w-12 h-12 text-emerald-400" />
                        </div>
                        <h2 className="text-4xl font-black text-white mb-4">Payment Successful!</h2>
                        <p className="text-slate-400 mb-8">
                            Thank you for your purchase. Your order has been confirmed and is being processed.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            Go to Dashboard <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                            <AlertCircle className="w-12 h-12 text-red-400" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4">Payment Failed</h2>
                        <p className="text-red-400 mb-8 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                            {message}
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/checkout')}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => navigate('/contact')}
                                className="flex-1 py-3 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-bold rounded-xl transition-all"
                            >
                                Contact Support
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
