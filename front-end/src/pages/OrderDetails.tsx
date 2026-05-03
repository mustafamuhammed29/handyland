import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, CreditCard, Repeat, AlertTriangle, Upload, RotateCcw, X, ShieldCheck, Loader2, FileText, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import { orderService } from '../services/orderService';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { Order } from '../types';
import { ENV } from '../config/env';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { VisualOrderTimeline } from '../components/VisualOrderTimeline';
import { formatPrice } from '../utils/formatPrice';

// Refund status display constants
const REFUND_STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    pending:      { label: 'Offen — Wird geprüft',       color: 'yellow', icon: '⏳' },
    under_review: { label: 'In Prüfung',                  color: 'blue',   icon: '🔍' },
    approved:     { label: 'Genehmigt ✅',                 color: 'emerald', icon: '✅' },
    rejected:     { label: 'Abgelehnt',                    color: 'red',    icon: '❌' },
    processed:    { label: 'Abgeschlossen & Erstattet',    color: 'slate',  icon: '💰' },
};

const REFUND_REASON_LABELS: Record<string, string> = {
    widerrufsrecht:   '§ 312g BGB — 14-Tage Widerrufsrecht',
    defective:        'Defekt / Beschädigt',
    wrong_item:       'Falscher Artikel geliefert',
    not_as_described: 'Nicht wie beschrieben',
    other:            'Sonstiges',
};

export const OrderDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { addToCart } = useCart();
    const { t } = useTranslation();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [paymentConfig, setPaymentConfig] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    // Refund modal state
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundReason, setRefundReason] = useState('widerrufsrecht');
    const [refundDescription, setRefundDescription] = useState('');
    const [refundConfirmed, setRefundConfirmed] = useState(false);
    const [submittingRefund, setSubmittingRefund] = useState(false);

    // Refund tracking state (from backend)
    const [activeRefund, setActiveRefund] = useState<any | null>(null);
    const [refundLoading, setRefundLoading] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await orderService.getOrder(id || '');
                if (res.success) {
                    setOrder(res.order);
                } else {
                    setError(t('orders.notFound'));
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message || t('orders.notFound'));
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchOrder();
    }, [id]);

    // Fetch refund status for this order
    const fetchRefundStatus = async (showLoading = true) => {
        if (!order) return;
        if (showLoading) setRefundLoading(true);
        try {
            const res: any = await api.get('/api/refunds/my');
            const refunds = res?.refunds || res?.data?.refunds || [];
            const match = refunds.find((r: any) => {
                const refOrderId = r.order?._id || r.order;
                return refOrderId === order._id || refOrderId === id;
            });
            if (match) {
                setActiveRefund(match);
                // Sync order status if backend missed it
                if (match.status === 'approved' || match.status === 'processed') {
                    if (order.status !== 'refunded') setOrder({ ...order, status: 'refunded' });
                }
            }
        } catch (err) {
            // Non-critical
        } finally {
            if (showLoading) setRefundLoading(false);
        }
    };

    useEffect(() => {
        fetchRefundStatus();
        
        // Polling every 20 seconds to catch admin updates
        const interval = setInterval(() => fetchRefundStatus(false), 20000);
        return () => clearInterval(interval);
    }, [order?._id, id]);

    useEffect(() => {
        if (order?.paymentMethod === 'bank_transfer') {
            const fetchSettings = async () => {
                try {
                    const res = await api.get('/api/settings');
                    const data = (res as any)?.data || res;
                    if (data && data?.payment?.bankTransfer) {
                        setPaymentConfig(data.payment.bankTransfer);
                    }
                } catch (e) {
                    console.error("Error fetching settings", e);
                }
            };
            fetchSettings();
        }
    }, [order?.paymentMethod]);

    const handleBuyAgain = () => {
        if (!order) return;
        order.items.forEach((item: any) => {
            // Map order item to cart item structure
            // Assuming item has product details mapped or populated
            const cartItem = {
                id: item.product?._id || item.product, // specific to how backend returns it
                title: item.name,
                subtitle: item.productType,
                price: item.price,
                image: item.image || item.product?.image || '',
                category: item.productType === 'Accessory' ? 'accessory' : 'device' as any,
                quantity: 1
            };
            addToCart(cartItem);
        });
        addToast(t('orders.addedToCart'), "success");
        // Open cart drawer? (optional, requires context update or ref)
    };

    const handleCancelOrder = async () => {
        if (!order) return;
        setCancelling(true);
        try {
            const res = await orderService.cancelOrder(order._id);
            if (res.success) {
                setOrder({ ...order, status: 'cancelled' });
                addToast(t('orders.cancelSuccess'), 'success');
                setShowCancelConfirm(false);
            }
        } catch (err: any) {
            addToast(err.response?.data?.message || t('orders.cancelFailed'), 'error');
            setShowCancelConfirm(false);
        } finally {
            setCancelling(false);
        }
    };

    const handleSubmitRefund = async () => {
        if (!order || !refundConfirmed) return;
        setSubmittingRefund(true);
        try {
            const res: any = await api.post('/api/refunds', {
                orderId: order._id,
                reason: refundReason,
                description: refundDescription,
                customerConfirmedReturn: refundConfirmed,
            });
            const newRefund = res?.refund || res?.data?.refund;
            setActiveRefund(newRefund);
            setOrder({ ...order, status: 'return_requested' });
            addToast(t('orders.refundSubmitSuccess', 'Rückgabeanfrage erfolgreich eingereicht!'), 'success');
            setShowRefundModal(false);
        } catch (err: any) {
            addToast(err.response?.data?.message || t('orders.refundSubmitFailed', 'Fehler beim Einreichen der Rückgabeanfrage.'), 'error');
        } finally {
            setSubmittingRefund(false);
        }
    };

    const handleCancelRefundRequest = async () => {
        if (!activeRefund || activeRefund.status !== 'pending') return;
        if (!window.confirm(t('orders.confirmCancelRefund', 'Möchten Sie diese Rückgabeanfrage wirklich stornieren?'))) return;
        
        try {
            await api.delete(`/api/refunds/${activeRefund._id}`);
            setActiveRefund(null);
            // Revert status to delivered if it was return_requested
            if (order?.status === 'return_requested') {
                setOrder({ ...order, status: 'delivered' });
            }
            addToast(t('orders.refundCancelSuccess', 'Rückgabeanfrage wurde storniert.'), 'success');
        } catch (err: any) {
            addToast(err.response?.data?.message || 'Fehler beim Stornieren.', 'error');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !order) return;
        const file = e.target.files[0];
        
        if (file.size > 5 * 1024 * 1024) {
            addToast('File size must be less than 5MB', 'error');
            e.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('receipt', file);
        try {
            setUploading(true);
            const res = await api.post(`/api/orders/${order._id || id}/receipt`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            } as any) as any;
            
            const data = res?.data || res;
            
            if (data?.success) {
                setReceiptUrl(data.receiptUrl);
                addToast(t('orders.receiptUploaded'), 'success');
                setOrder({ ...order, paymentReceipt: data.receiptUrl } as any);
            } else {
                addToast(data?.message || t('orders.uploadError'), 'error');
            }
        } catch (err: any) {
            addToast(err?.response?.data?.message || t('orders.uploadError'), 'error');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[100dvh] pt-32 pb-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-[100dvh] pt-32 pb-12 px-4 max-w-3xl mx-auto text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('orders.notFound')}</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">{error}</p>
                <button onClick={() => navigate('/dashboard')} className="bg-slate-800 text-slate-900 dark:text-white px-6 py-2 rounded-xl hover:bg-slate-700">
                    {t('orders.backToDashboard')}
                </button>
            </div>
        );
    }

    const isCancelled = order.status === 'cancelled';

    return (
        <>
        <div className="min-h-[100dvh] pt-28 pb-12 px-4 max-w-4xl mx-auto">
            {/* Cancel Confirmation Dialog */}
            {showCancelConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center gap-2 text-amber-400 mb-4">
                            <AlertTriangle className="w-5 h-5" />
                            <h3 className="text-lg font-bold">{t('orders.cancelOrder')}</h3>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm mb-6">
                            Are you sure you want to cancel this order? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-700 transition-colors font-medium"
                                disabled={cancelling}
                            >
                                {t('orders.keepOrder')}
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={cancelling}
                                className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 border border-transparent transition-colors font-bold"
                            >
                                {cancelling ? t('orders.cancelling') : t('orders.confirmCancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Breadcrumbs */}
            <Breadcrumbs items={[
                { label: 'Home', path: '/' },
                { label: 'Dashboard', path: '/dashboard' },
                { label: `Order #${order.orderNumber || order._id?.slice(-6).toUpperCase() || ''}` }
            ]} className="mb-6" />
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/dashboard')} aria-label="Back to dashboard" className="p-2 bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        Order #{order.orderNumber || (order._id ? order._id.slice(-6).toUpperCase() : '')}
                        <span className={`text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold border ${isCancelled ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                            order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            order.status === 'return_requested' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                            order.status === 'refunded' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}>
                            {t(`orders.status.${order.status}`, order.status)}
                        </span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">

                    {/* Bank Transfer Upload Section */}
                    {order.paymentMethod === 'bank_transfer' && order.paymentStatus !== 'paid' && !isCancelled && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-3xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                            <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2 relative z-10">
                                <AlertTriangle className="w-5 h-5" /> Action Required: Bank Transfer
                            </h2>
                            <p className="text-slate-700 dark:text-slate-300 text-sm mb-4 relative z-10">
                                {paymentConfig?.instructions || "Please transfer the total amount to the following bank account. Include the Order Number as the reference (Verwendungszweck)."}
                            </p>

                            <div className="bg-slate-900 rounded-xl p-4 space-y-2 mb-6 text-sm relative z-10 border border-slate-800">
                                <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                    <span className="text-slate-500 dark:text-slate-400">Bank:</span>
                                    <span className="text-slate-900 dark:text-white font-bold select-all">{paymentConfig?.bankName || import.meta.env.VITE_BANK_NAME || "Pending Configuration"}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                    <span className="text-slate-500 dark:text-slate-400">Account Holder:</span>
                                    <span className="text-slate-900 dark:text-white font-bold select-all">{paymentConfig?.accountHolder || import.meta.env.VITE_BANK_HOLDER || "Your Company"}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                    <span className="text-slate-500 dark:text-slate-400">IBAN:</span>
                                    <span className="text-slate-900 dark:text-white font-bold select-all">{paymentConfig?.iban || import.meta.env.VITE_BANK_IBAN || "DE00 0000 0000 0000 0000 00"}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                    <span className="text-slate-500 dark:text-slate-400">BIC:</span>
                                    <span className="text-slate-900 dark:text-white font-bold select-all">{paymentConfig?.bic || import.meta.env.VITE_BANK_BIC || "XXXXXXXX"}</span>
                                </div>
                                <div className="flex justify-between items-center bg-blue-500/20 p-2 rounded border border-blue-500/30 mt-4">
                                    <span className="text-blue-300 font-bold">Reference:</span>
                                    <span className="text-slate-900 dark:text-white font-bold font-mono text-lg select-all">#{(order.orderNumber || order._id?.slice(-6).toUpperCase() || '')}</span>
                                </div>
                            </div>

                            <div className="border-t border-blue-500/20 pt-4 relative z-10">
                                <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">Upload Payment Receipt</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Upload a screenshot or photo of your transfer receipt to speed up processing.</p>

                                {(receiptUrl || (order as any).paymentReceipt) ? (
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                                        <CheckCircle className="w-5 h-5 shadow-emerald-500/50 drop-shadow-lg" />
                                        Receipt Uploaded Successfully
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-500 p-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 group">
                                        {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="w-5 h-5 text-blue-200 group-hover:-translate-y-1 transition-transform" />}
                                        <span className="text-slate-900 dark:text-white font-bold group-hover:text-slate-900 dark:text-white transition-colors">{uploading ? 'Uploading...' : 'Upload Receipt Image'}</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Items */}
                    <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 overflow-hidden">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-400" /> {t('orders.items')}
                        </h2>
                        <div className="space-y-4">
                            {order.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex gap-4 p-3 bg-black/30 rounded-xl border border-slate-800/50">
                                    <div className="w-16 h-16 bg-slate-800 rounded-lg shrink-0 overflow-hidden">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                <Package className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-slate-900 dark:text-white font-medium line-clamp-1">{item.name}</div>
                                        <div className="text-xs text-slate-500 mt-1">Qty: {item.quantity} × {formatPrice(item.price)}</div>
                                    </div>
                                    <div className="text-slate-900 dark:text-white font-bold">
                                        {formatPrice(item.quantity * item.price)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
                            <button onClick={handleBuyAgain} className="text-sm font-bold text-brand-primary hover:text-brand-primary flex items-center gap-2 transition-colors">
                                <Repeat className="w-4 h-4" /> {t('orders.buyAgain')}
                            </button>
                        </div>
                    </div>

                    {/* Timeline */}
                    <VisualOrderTimeline
                        currentStatus={order.status}
                        type="order"
                        history={order.history || [{ status: order.status, date: order.updatedAt || new Date().toISOString() }]}
                    />

                    {/* ═══════ REFUND STATUS CARD ═══════ */}
                    {activeRefund && (
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                            {/* Glow accent */}
                            <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] pointer-events-none ${
                                activeRefund.status === 'approved' || activeRefund.status === 'processed' ? 'bg-emerald-500/15' :
                                activeRefund.status === 'rejected' ? 'bg-red-500/15' :
                                activeRefund.status === 'under_review' ? 'bg-blue-500/15' :
                                'bg-orange-500/15'
                            }`} />

                            {/* Header */}
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <RotateCcw className="w-5 h-5 text-orange-400" />
                                    {t('orders.refundStatus', 'Rückgabe-Status')}
                                </h3>
                                <span className={`text-[11px] px-4 py-1.5 rounded-full border font-black uppercase tracking-widest ${
                                    activeRefund.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                                    activeRefund.status === 'under_review' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                    activeRefund.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                    activeRefund.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                    'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30'
                                }`}>
                                    {REFUND_STATUS_CONFIG[activeRefund.status]?.icon} {REFUND_STATUS_CONFIG[activeRefund.status]?.label || activeRefund.status}
                                </span>
                            </div>

                            {/* Mini Refund Timeline */}
                            <div className="relative z-10 mb-6">
                                <div className="flex items-center justify-between gap-1">
                                    {['pending', 'under_review', 'approved', 'processed'].map((step, idx) => {
                                        const stepOrder = ['pending', 'under_review', 'approved', 'processed'];
                                        const currentIdx = stepOrder.indexOf(activeRefund.status);
                                        const isRejected = activeRefund.status === 'rejected';
                                        const isCompleted = !isRejected && idx <= currentIdx;
                                        const isActive = !isRejected && idx === currentIdx;
                                        const labels = ['Eingereicht', 'In Prüfung', 'Genehmigt', 'Erstattet'];

                                        return (
                                            <div key={step} className="flex-1 flex flex-col items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-500 ${
                                                    isRejected && step === 'approved' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                                                    isCompleted ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                                                    isActive ? 'bg-blue-500/20 border-blue-400 text-blue-400 animate-pulse' :
                                                    'bg-slate-800 border-slate-700 text-slate-600'
                                                }`}>
                                                    {isCompleted && !isActive ? '✓' : idx + 1}
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider text-center leading-tight ${
                                                    isCompleted ? 'text-slate-700 dark:text-slate-300' : 'text-slate-600'
                                                }`}>{labels[idx]}</span>
                                                {idx < 3 && (
                                                    <div className={`absolute top-4 h-0.5 transition-all duration-700 ${
                                                        isCompleted && idx < currentIdx ? 'bg-emerald-500/50' : 'bg-slate-800'
                                                    }`} style={{ left: `${(idx + 0.5) * 25}%`, width: '20%' }} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {activeRefund.status === 'rejected' && (
                                    <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm font-bold">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        {t('orders.refundRejectedNote', 'Ihre Rückgabeanfrage wurde leider abgelehnt.')}
                                    </div>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-2">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Grund</p>
                                    <p className="text-slate-900 dark:text-white font-bold text-sm">{REFUND_REASON_LABELS[activeRefund.reason] || activeRefund.reason}</p>
                                </div>
                                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-2">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Erstattungsbetrag</p>
                                    <p className="text-emerald-400 font-black text-xl tracking-tight">{formatPrice(activeRefund.refundAmount || order.totalAmount)}</p>
                                </div>
                                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-2">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Eingereicht am</p>
                                    <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">{new Date(activeRefund.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                </div>
                                {activeRefund.resolvedAt && (
                                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Bearbeitet am</p>
                                        <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">{new Date(activeRefund.resolvedAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                )}
                            </div>

                            {/* Admin Notes */}
                            {activeRefund.adminNotes && (
                                <div className="relative z-10 mt-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare className="w-4 h-4 text-blue-400" />
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.15em]">Hinweis vom Team</p>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{activeRefund.adminNotes}</p>
                                </div>
                            )}

                            {/* Description */}
                            {activeRefund.description && (
                                <div className="relative z-10 mt-4 bg-slate-950/30 border border-slate-800/50 rounded-2xl p-4">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2">Ihre Beschreibung</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm italic leading-relaxed">"{activeRefund.description}"</p>
                                </div>
                            )}
                        </div>
                    )}

                    {refundLoading && (
                        <div className="flex items-center justify-center py-6 text-slate-500">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            <span className="text-sm">{t('orders.loadingRefundStatus', 'Rückgabe-Status wird geladen...')}</span>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-4">{t('checkout.orderSummary')}</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                <span>{t('orders.subtotal')}</span>
                                <span>€{(order.totalAmount - (order.tax || 0) - (order.shippingFee || 0)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                <span>{t('orders.shipping')}</span>
                                <span>€{(order.shippingFee || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                <span>{t('orders.tax')}</span>
                                <span>€{(order.tax || 0).toFixed(2)}</span>
                            </div>
                            <div className="h-px bg-slate-800 my-2"></div>
                            <div className="flex justify-between text-slate-900 dark:text-white font-bold text-lg">
                                <span>{t('orders.total')}</span>
                                <span>€{order.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-400" /> {t('orders.deliveryDetails')}
                        </h2>
                        {order.shippingAddress ? (
                            <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
                                <div className="text-slate-900 dark:text-white font-medium">{order.shippingAddress.fullName}</div>
                                <div>{order.shippingAddress.street}</div>
                                <div>{order.shippingAddress.zipCode} {order.shippingAddress.city}</div>
                                <div>{order.shippingAddress.country}</div>
                                <div className="pt-2 text-xs">{order.shippingAddress.phone}</div>
                            </div>
                        ) : (
                            <div className="text-slate-500 italic">No address details</div>
                        )}
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                        <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-yellow-400" /> {t('orders.payment')}
                        </h2>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex justify-between mb-1">
                                <span>Method</span>
                                <span className="text-slate-900 dark:text-white font-medium">
                                    {(() => {
                                        switch (order.paymentMethod) {
                                            case 'stripe': return 'Credit Card (Stripe)';
                                            case 'paypal': return 'PayPal';
                                            case 'klarna': return 'Klarna';
                                            case 'giropay': return 'Giropay';
                                            case 'sepa_debit': return 'SEPA Direct Debit';
                                            case 'sofort': return 'Sofort';
                                            case 'cod': return 'Cash on Delivery';
                                            default: return order.paymentMethod ? order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1) : 'Unknown';
                                        }
                                    })()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Status</span>
                                <span className={`capitalize font-bold ${order.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                    {order.paymentStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => orderService.downloadInvoice(order._id)}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl transition-colors font-bold text-sm"
                    >
                        {t('orders.downloadInvoice')}
                    </button>
                    {order.status === 'pending' && (
                        <button
                            onClick={() => setShowCancelConfirm(true)}
                            disabled={cancelling}
                            className="w-full py-3 border border-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-400 hover:border-red-500/30 rounded-xl transition-colors font-bold text-sm disabled:opacity-50"
                        >
                            {t('orders.cancelOrder')}
                        </button>
                    )}
                    {(order.status === 'delivered' || order.status === 'shipped') && !activeRefund && order.paymentStatus !== 'refunded' && (
                        <button
                            onClick={() => setShowRefundModal(true)}
                            className="w-full py-3 border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" /> {t('orders.requestRefund', 'Rückgabe / Erstattung anfordern')}
                        </button>
                    )}
                    {activeRefund && activeRefund.status === 'pending' && (
                        <div className="space-y-2">
                            <div className="w-full py-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
                                <Clock className="w-4 h-4" /> {t('orders.refundPending', 'Rückgabeanfrage wird geprüft')}
                            </div>
                            <button 
                                onClick={handleCancelRefundRequest}
                                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-red-400 transition-colors"
                            >
                                {t('orders.cancelRefundRequest', 'Anfrage stornieren')}
                            </button>
                        </div>
                    )}
                    {activeRefund && activeRefund.status === 'approved' && (
                        <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4" /> {t('orders.refundApproved', 'Rückerstattung genehmigt ✅')}
                        </div>
                    )}
                    {activeRefund && activeRefund.status === 'rejected' && (
                        <div className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> {t('orders.refundRejected', 'Rückgabeanfrage abgelehnt')}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Refund Request Modal */}
        {showRefundModal && order && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90dvh] overflow-y-auto">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <RotateCcw className="w-5 h-5 text-orange-400" /> Refund / Rückgabe
                        </h3>
                        <button onClick={() => setShowRefundModal(false)} title="Close refund modal" aria-label="Close refund modal" className="text-slate-500 hover:text-slate-900 dark:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300 flex gap-3">
                        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold block mb-1">Widerrufsrecht (§ 312g BGB)</span>
                            Sie haben das Recht, innerhalb von <strong>14 Tagen</strong> ohne Angabe von Gründen zu widerrufen.
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Grund / Reason *</label>
                        <select value={refundReason} onChange={e => setRefundReason(e.target.value)}
                            title="Refund reason" aria-label="Refund reason"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-orange-500 outline-none">
                            <option value="widerrufsrecht">Widerrufsrecht — 14-Day Withdrawal (EU Law)</option>
                            <option value="defective">Defective / Damaged (Mangelhaft)</option>
                            <option value="wrong_item">Wrong Item Received (Falsche Lieferung)</option>
                            <option value="not_as_described">Not as Described</option>
                            <option value="other">Other / Sonstiges</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Details (optional)</label>
                        <textarea value={refundDescription} onChange={e => setRefundDescription(e.target.value)}
                            placeholder="Please describe the issue..." rows={3} maxLength={1000}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-orange-500 outline-none resize-none text-sm" />
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Refund Amount</span>
                        <span className="text-emerald-400 font-bold">{formatPrice(order.totalAmount)}</span>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={refundConfirmed} onChange={e => setRefundConfirmed(e.target.checked)} className="mt-1 w-4 h-4 accent-orange-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                            I confirm I will return the product(s). <span className="text-orange-400">(Ich bestätige die Rücksendung.)</span>
                        </span>
                    </label>
                    <div className="flex gap-3">
                        <button onClick={() => setShowRefundModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold">Cancel</button>
                        <button onClick={handleSubmitRefund} disabled={!refundConfirmed || submittingRefund}
                            className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-slate-900 dark:text-white rounded-xl font-bold flex items-center justify-center gap-2">
                            {submittingRefund ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : <><RotateCcw className="w-4 h-4" /> Submit</>}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};
