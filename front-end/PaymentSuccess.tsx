import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, ArrowRight, Download, Package, Home } from 'lucide-react';
import { useCart } from './context/CartContext';
import { ENV } from './src/config/env';

interface OrderSummary {
    id: string;
    _id?: string;
    totalAmount: number;
    items: any[];
}

const PaymentSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const orderId = searchParams.get('order_id'); // Support for COD/Direct orders
    const navigate = useNavigate();
    const { clearCart } = useCart();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying order details...');
    const [order, setOrder] = useState<OrderSummary | null>(null);

    useEffect(() => {
        if (!sessionId && !orderId) {
            setStatus('error');
            setMessage('Invalid session. No transaction ID found.');
            return;
        }

        const verifyOrder = async () => {
            try {
                const token = localStorage.getItem('token'); // Changed from userToken to match AuthContext
                const headers: any = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const baseUrl = ENV.API_URL.endsWith('/api') ? ENV.API_URL.slice(0, -4) : ENV.API_URL;

                let data;

                if (sessionId) {
                    // Stripe Verification
                    const response = await fetch(`${baseUrl}/api/payment/success`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ sessionId })
                    });
                    data = await response.json();
                } else if (orderId) {
                    // COD / Direct Order Verification
                    // We assume if they have the ID and are redirected here, it's valid for now.
                    // For guests, we can't easily fetch details without a public token.
                    // If logged in, we fetch the order.
                    if (token) {
                        const response = await fetch(`${baseUrl}/api/orders/${orderId}`, {
                            method: 'GET',
                            headers
                        });
                        const resData = await response.json();
                        if (resData.success) {
                            data = { success: true, order: resData.order };
                        } else {
                            data = { success: false, message: "Order not found" };
                        }
                    } else {
                        // Guest COD Success - Mock the order summary or just show success
                        // We can't fetch details securely.
                        data = {
                            success: true,
                            order: {
                                id: orderId,
                                totalAmount: 0, // Unknown
                                items: []
                            }
                        };
                    }
                }

                if (data.success) {
                    setStatus('success');
                    setOrder(data.order);
                    clearCart();
                    localStorage.removeItem('checkout_shipping'); // Clear saved shipping info
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Payment verification failed.');
                }
            } catch (error) {
                console.error('Order verification error:', error);
                setStatus('error');
                setMessage('Could not connect to the verification server.');
            }
        };

        verifyOrder();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, orderId]);

    const handleDownloadInvoice = () => {
        // Mock invoice download
        alert("Invoice download started... (Feature coming soon)");
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="w-full max-w-2xl relative z-10">

                {/* Loading State */}
                {status === 'loading' && (
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-12 text-center shadow-2xl">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-white mb-2">Verifying Transaction</h2>
                        <p className="text-slate-400 text-lg">Please wait while we secure your order...</p>
                    </div>
                )}

                {/* Success State */}
                {status === 'success' && (
                    <div className="animate-in zoom-in duration-500 space-y-6">
                        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 md:p-12 text-center shadow-[0_0_50px_rgba(16,185,129,0.15)]">
                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/30">
                                <CheckCircle className="w-12 h-12 text-white" />
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                                Order Confirmed!
                            </h1>
                            <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                                Thank you for your purchase. We have received your order and are getting it ready for shipment.
                            </p>

                            {order && (
                                <div className="bg-slate-950/50 rounded-xl p-4 mb-8 border border-slate-800 inline-block text-left">
                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Order ID</div>
                                    <div className="text-white font-mono text-lg tracking-wide select-all">#{(order._id || order.id || "").slice(-8).toUpperCase()}</div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Package className="w-5 h-5 group-hover:scale-110 transition-transform" /> Track Order
                                </button>
                                <button
                                    onClick={handleDownloadInvoice}
                                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" /> Invoice
                                </button>
                            </div>
                        </div>

                        <div className="text-center">
                            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
                                <Home className="w-4 h-4" /> Return to Home
                            </Link>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {status === 'error' && (
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-12 text-center shadow-2xl animate-in shake">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/50">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Verification Failed</h2>
                        <p className="text-red-400 mb-8 bg-red-950/30 p-4 rounded-xl border border-red-900/50">
                            {message}
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => navigate('/contact')}
                                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
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
