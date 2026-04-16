import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Download, Package, Home, Upload } from 'lucide-react';
import { useCart } from './context/CartContext';
import { useToast } from './context/ToastContext';
import { ENV } from './config/env';
import { useQueryClient } from '@tanstack/react-query';
import { dashboardKeys } from './hooks/useDashboardData';

interface OrderSummary {
    id: string;
    _id?: string;
    totalAmount: number;
    items: any[];
}

const PaymentSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const orderId = searchParams.get('order_id');
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying order details...');
    const [order, setOrder] = useState<OrderSummary | null>(null);

    const method = searchParams.get('method');
    const [paymentConfig, setPaymentConfig] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId && !orderId) {
            setStatus('error');
            setMessage('Invalid session. No transaction ID found.');
            return;
        }

        const verifyOrder = async () => {
            try {
                const headers: any = { 'Content-Type': 'application/json' };

                const baseUrl = ENV.API_URL.endsWith('/api') ? ENV.API_URL.slice(0, -4) : ENV.API_URL;

                let data;

                if (sessionId) {
                    // Stripe Verification
                    const response = await fetch(`${baseUrl}/api/payment/success`, {
                        method: 'POST',
                        headers,
                        credentials: 'include',
                        body: JSON.stringify({ sessionId })
                    });
                    data = await response.json();
                } else if (orderId) {
                    // COD / Direct Order Verification
                    // We assume if they have the ID and are redirected here, it's valid for now.
                    // For guests, we can't easily fetch details without a public token.
                    // If logged in, we fetch the order.
                    // We can check if `user` context exists, but inside useEffect we might not have it.
                    // The backend API will return 401 if not authorized anyway.
                    try {
                        const response = await fetch(`${baseUrl}/api/orders/${orderId}`, {
                            method: 'GET',
                            headers,
                            credentials: 'include'
                        });
                        const resData = await response.json();
                        if (resData.success) {
                            data = { success: true, order: resData.order };
                        } else {
                            data = { success: false, message: "Order not found" };
                        }
                    } catch (e) {
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

                if (data && data.success) {
                    setStatus('success');
                    setOrder(data.order);
                    clearCart();
                    localStorage.removeItem('checkout_shipping');

                    // Invalidate React Query cache so dashboard shows new order immediately
                    queryClient.invalidateQueries({ queryKey: dashboardKeys.orders() });
                    queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
                } else {
                    setStatus('error');
                    setMessage(data?.message || 'Payment verification failed.');
                }
            } catch (error) {
                if (process.env.NODE_ENV !== 'production') console.error('Order verification error:', error);
                setStatus('error');
                setMessage('Could not connect to the verification server.');
            }
        };

        verifyOrder();

        // Fetch Bank Transfer settings if method is bank_transfer
        if (method === 'bank_transfer') {
            const fetchSettings = async () => {
                try {
                    const baseUrl = ENV.API_URL.endsWith('/api') ? ENV.API_URL.slice(0, -4) : ENV.API_URL;
                    const res = await fetch(`${baseUrl}/api/settings`);
                    const data = await res.json();
                    if (data && data.payment && data.payment.bankTransfer) {
                        setPaymentConfig(data.payment.bankTransfer);
                    }
                } catch (e) {
                    console.error("Error fetching settings", e);
                }
            };
            fetchSettings();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, orderId, method]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('receipt', file);
        try {
            setUploading(true);
            const baseUrl = ENV.API_URL.endsWith('/api') ? ENV.API_URL.slice(0, -4) : ENV.API_URL;

            // Ensure we have a CSRF token before uploading (multipart bypasses interceptor)
            let csrfToken = document.cookie.split('; ').find(r => r.startsWith('XSRF-TOKEN='))?.split('=')[1];
            if (!csrfToken) {
                await fetch(`${baseUrl}/api/auth/csrf`, { credentials: 'include' });
                csrfToken = document.cookie.split('; ').find(r => r.startsWith('XSRF-TOKEN='))?.split('=')[1];
            }

            const headers: Record<string, string> = {};
            if (csrfToken) headers['X-XSRF-Token'] = csrfToken;

            const res = await fetch(`${baseUrl}/api/orders/${orderId}/receipt`, {
                method: 'POST',
                credentials: 'include',
                headers,
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setReceiptUrl(data.receiptUrl);
                addToast('Receipt uploaded successfully! We will process your order soon.', 'success');
            } else {
                addToast(data.message || 'Failed to upload receipt', 'error');
            }
        } catch (err) {
            addToast('Error uploading receipt', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadInvoice = async () => {
        if (!order) return;
        const id = order._id || order.id;
        if (!id) return addToast('Bestellungs-ID nicht gefunden', 'error');
        try {
            const baseUrl = ENV.API_URL.endsWith('/api') ? ENV.API_URL.slice(0, -4) : ENV.API_URL;
            const response = await fetch(`${baseUrl}/api/orders/${id}/invoice`, {
                credentials: 'include'
            });
            const html = await response.text();
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch {
            alert('Rechnung konnte nicht geladen werden.');
        }
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
                                <div className="bg-slate-950/50 rounded-xl p-4 mb-4 border border-slate-800 inline-block text-center">
                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Order Number (Reference)</div>
                                    <div className="text-white font-mono text-2xl font-black tracking-wide select-all">#{(order._id || order.id || "").slice(-8).toUpperCase()}</div>
                                </div>
                            )}

                            {method === 'bank_transfer' && (
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8 text-left max-w-lg mx-auto">
                                    <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                                        Bank Transfer Instructions
                                    </h3>
                                    <p className="text-slate-300 text-sm mb-4">
                                        {paymentConfig?.instructions || "Please transfer the total amount to the following bank account. Include the Order Number as the reference (Verwendungszweck)."}
                                    </p>

                                    <div className="bg-slate-900 rounded-lg p-4 space-y-2 mb-6">
                                        <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                            <span className="text-slate-400 text-sm">Bank:</span>
                                            <span className="text-white font-bold select-all">{paymentConfig?.bankName || import.meta.env.VITE_BANK_NAME || "Pending Configuration"}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                            <span className="text-slate-400 text-sm">Account Holder:</span>
                                            <span className="text-white font-bold select-all">{paymentConfig?.accountHolder || import.meta.env.VITE_BANK_HOLDER || "Your Company"}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                            <span className="text-slate-400 text-sm">IBAN:</span>
                                            <span className="text-white font-bold select-all">{paymentConfig?.iban || import.meta.env.VITE_BANK_IBAN || "DE00 0000 0000 0000 0000 00"}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                            <span className="text-slate-400 text-sm">BIC:</span>
                                            <span className="text-white font-bold select-all">{paymentConfig?.bic || import.meta.env.VITE_BANK_BIC || "XXXXXXXX"}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-blue-500/20 p-2 rounded border border-blue-500/30 mt-4">
                                            <span className="text-blue-300 text-sm font-bold">Reference:</span>
                                            <span className="text-white font-bold font-mono text-lg select-all">#{(order?._id || order?.id || "").slice(-8).toUpperCase()}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-700/50 pt-4">
                                        <h4 className="font-bold text-white mb-2 text-sm">Upload Payment Receipt</h4>
                                        <p className="text-xs text-slate-400 mb-4">To speed up processing, you can upload a screenshot or photo of your transfer receipt here.</p>

                                        {receiptUrl ? (
                                            <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 p-3 rounded-lg">
                                                <CheckCircle className="w-5 h-5" />
                                                Receipt Uploaded Successfully
                                            </div>
                                        ) : (
                                            <label className="flex items-center justify-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 p-3 rounded-lg border border-dashed border-slate-600 transition-colors">
                                                {uploading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Upload className="w-5 h-5 text-slate-400" />}
                                                <span className="text-white text-sm font-medium">{uploading ? 'Uploading...' : 'Choose File'}</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                            </label>
                                        )}
                                    </div>
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
