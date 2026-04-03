import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, CreditCard, Repeat, AlertTriangle, Upload } from 'lucide-react';
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
            <div className="min-h-screen pt-32 pb-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen pt-32 pb-12 px-4 max-w-3xl mx-auto text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">{t('orders.notFound')}</h2>
                <p className="text-slate-400 mb-8">{error}</p>
                <button onClick={() => navigate('/dashboard')} className="bg-slate-800 text-white px-6 py-2 rounded-xl hover:bg-slate-700">
                    {t('orders.backToDashboard')}
                </button>
            </div>
        );
    }

    const isCancelled = order.status === 'cancelled';

    return (
        <div className="min-h-screen pt-28 pb-12 px-4 max-w-4xl mx-auto">
            {/* Cancel Confirmation Dialog */}
            {showCancelConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center gap-2 text-amber-400 mb-4">
                            <AlertTriangle className="w-5 h-5" />
                            <h3 className="text-lg font-bold">{t('orders.cancelOrder')}</h3>
                        </div>
                        <p className="text-slate-300 text-sm mb-6">
                            Are you sure you want to cancel this order? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors font-medium"
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
                <button onClick={() => navigate('/dashboard')} aria-label="Back to dashboard" className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        Order #{order.orderNumber || (order._id ? order._id.slice(-6).toUpperCase() : '')}
                        <span className={`text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold border ${isCancelled ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                            order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}>
                            {order.status}
                        </span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</p>
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
                            <p className="text-slate-300 text-sm mb-4 relative z-10">
                                {paymentConfig?.instructions || "Please transfer the total amount to the following bank account. Include the Order Number as the reference (Verwendungszweck)."}
                            </p>

                            <div className="bg-slate-900 rounded-xl p-4 space-y-2 mb-6 text-sm relative z-10 border border-slate-800">
                                <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                    <span className="text-slate-400">Bank:</span>
                                    <span className="text-white font-bold select-all">{paymentConfig?.bankName || import.meta.env.VITE_BANK_NAME || "Pending Configuration"}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                    <span className="text-slate-400">Account Holder:</span>
                                    <span className="text-white font-bold select-all">{paymentConfig?.accountHolder || import.meta.env.VITE_BANK_HOLDER || "Your Company"}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                    <span className="text-slate-400">IBAN:</span>
                                    <span className="text-white font-bold select-all">{paymentConfig?.iban || import.meta.env.VITE_BANK_IBAN || "DE00 0000 0000 0000 0000 00"}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                    <span className="text-slate-400">BIC:</span>
                                    <span className="text-white font-bold select-all">{paymentConfig?.bic || import.meta.env.VITE_BANK_BIC || "XXXXXXXX"}</span>
                                </div>
                                <div className="flex justify-between items-center bg-blue-500/20 p-2 rounded border border-blue-500/30 mt-4">
                                    <span className="text-blue-300 font-bold">Reference:</span>
                                    <span className="text-white font-bold font-mono text-lg select-all">#{(order.orderNumber || order._id?.slice(-6).toUpperCase() || '')}</span>
                                </div>
                            </div>

                            <div className="border-t border-blue-500/20 pt-4 relative z-10">
                                <h4 className="font-bold text-white mb-2 text-sm">Upload Payment Receipt</h4>
                                <p className="text-xs text-slate-400 mb-4">Upload a screenshot or photo of your transfer receipt to speed up processing.</p>

                                {(receiptUrl || (order as any).paymentReceipt) ? (
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                                        <CheckCircle className="w-5 h-5 shadow-emerald-500/50 drop-shadow-lg" />
                                        Receipt Uploaded Successfully
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-500 p-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 group">
                                        {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="w-5 h-5 text-blue-200 group-hover:-translate-y-1 transition-transform" />}
                                        <span className="text-white font-bold group-hover:text-white transition-colors">{uploading ? 'Uploading...' : 'Upload Receipt Image'}</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Items */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 overflow-hidden">
                        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
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
                                        <div className="text-white font-medium line-clamp-1">{item.name}</div>
                                        <div className="text-xs text-slate-500 mt-1">Qty: {item.quantity} × {formatPrice(item.price)}</div>
                                    </div>
                                    <div className="text-white font-bold">
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
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                        <h2 className="font-bold text-white mb-4">{t('checkout.orderSummary')}</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-slate-400">
                                <span>{t('orders.subtotal')}</span>
                                <span>€{(order.totalAmount - (order.tax || 0) - (order.shippingFee || 0)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>{t('orders.shipping')}</span>
                                <span>€{(order.shippingFee || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>{t('orders.tax')}</span>
                                <span>€{(order.tax || 0).toFixed(2)}</span>
                            </div>
                            <div className="h-px bg-slate-800 my-2"></div>
                            <div className="flex justify-between text-white font-bold text-lg">
                                <span>{t('orders.total')}</span>
                                <span>€{order.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-400" /> {t('orders.deliveryDetails')}
                        </h2>
                        {order.shippingAddress ? (
                            <div className="text-sm text-slate-400 space-y-1">
                                <div className="text-white font-medium">{order.shippingAddress.fullName}</div>
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
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-yellow-400" /> {t('orders.payment')}
                        </h2>
                        <div className="text-sm text-slate-400">
                            <div className="flex justify-between mb-1">
                                <span>Method</span>
                                <span className="text-white font-medium">
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
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-bold text-sm"
                    >
                        {t('orders.downloadInvoice')}
                    </button>
                    {order.status === 'pending' && (
                        <button
                            onClick={() => setShowCancelConfirm(true)}
                            disabled={cancelling}
                            className="w-full py-3 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 rounded-xl transition-colors font-bold text-sm disabled:opacity-50"
                        >
                            {t('orders.cancelOrder')}
                        </button>
                    )}
                    {order.status === 'delivered' && (
                        <button 
                            disabled
                            title={t('common.comingSoon')}
                            className="w-full py-3 border border-slate-800 text-slate-500 cursor-not-allowed rounded-xl font-bold text-sm"
                        >
                            {t('orders.requestRefund')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
