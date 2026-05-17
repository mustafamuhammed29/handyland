import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import { orderService } from '../services/orderService';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { Order } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { VisualOrderTimeline } from '../components/VisualOrderTimeline';

// Child Components
import { BankTransferUpload } from './OrderDetails/BankTransferUpload';
import { OrderItemsList } from './OrderDetails/OrderItemsList';
import { OrderSidebar } from './OrderDetails/OrderSidebar';
import { RefundStatusCard } from './OrderDetails/RefundStatusCard';
import { RefundModal } from './OrderDetails/RefundModal';
import { CancelOrderModal } from './OrderDetails/CancelOrderModal';

export const OrderDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { addToCart } = useCart();
    const { t } = useTranslation();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
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
        const interval = setInterval(() => fetchRefundStatus(false), 20000);
        return () => clearInterval(interval);
    }, [order?._id, id]);

    const handleBuyAgain = () => {
        if (!order) return;
        order.items.forEach((item: any) => {
            const cartItem = {
                id: item.product?._id || item.product,
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
    };

    const handleCancelRefundRequest = async () => {
        if (!activeRefund || activeRefund.status !== 'pending') return;
        if (!window.confirm(t('orders.confirmCancelRefund', 'Möchten Sie diese Rückgabeanfrage wirklich stornieren?'))) return;
        
        try {
            await api.delete(`/api/refunds/${activeRefund._id}`);
            setActiveRefund(null);
            if (order?.status === 'return_requested') {
                setOrder({ ...order, status: 'delivered' });
            }
            addToast(t('orders.refundCancelSuccess', 'Rückgabeanfrage wurde storniert.'), 'success');
        } catch (err: any) {
            addToast(err.response?.data?.message || 'Fehler beim Stornieren.', 'error');
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
            {showCancelConfirm && (
                <CancelOrderModal
                    orderId={order._id}
                    onClose={() => setShowCancelConfirm(false)}
                    onSuccess={() => {
                        setOrder({ ...order, status: 'cancelled' });
                        setShowCancelConfirm(false);
                    }}
                />
            )}

            <Breadcrumbs items={[
                { label: 'Home', path: '/' },
                { label: 'Dashboard', path: '/dashboard' },
                { label: `Order #${order.orderNumber || order._id?.slice(-6).toUpperCase() || ''}` }
            ]} className="mb-6" />

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
                <div className="md:col-span-2 space-y-6">
                    <BankTransferUpload 
                        order={order} 
                        orderId={order._id || id || ''} 
                        onUploadSuccess={(url) => setOrder({ ...order, paymentReceipt: url } as any)} 
                    />

                    <OrderItemsList order={order} onBuyAgain={handleBuyAgain} />

                    <VisualOrderTimeline
                        currentStatus={order.status}
                        type="order"
                        history={order.history || [{ status: order.status, date: order.updatedAt || new Date().toISOString() }]}
                    />

                    <RefundStatusCard activeRefund={activeRefund} orderTotalAmount={order.totalAmount} />

                    {refundLoading && (
                        <div className="flex items-center justify-center py-6 text-slate-500">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            <span className="text-sm">{t('orders.loadingRefundStatus', 'Rückgabe-Status wird geladen...')}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <OrderSidebar 
                        order={order}
                        activeRefund={activeRefund}
                        cancelling={false}
                        onCancelOrder={() => setShowCancelConfirm(true)}
                        onRequestRefund={() => setShowRefundModal(true)}
                        onCancelRefundRequest={handleCancelRefundRequest}
                    />
                </div>
            </div>
        </div>

        {showRefundModal && (
            <RefundModal 
                orderId={order._id}
                totalAmount={order.totalAmount}
                onClose={() => setShowRefundModal(false)}
                onSuccess={(newRefund) => {
                    setActiveRefund(newRefund);
                    setOrder({ ...order, status: 'return_requested' });
                    setShowRefundModal(false);
                }}
            />
        )}
        </>
    );
};
