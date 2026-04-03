import React, { useState } from 'react';
import { Package, Download, ChevronRight, Search, Filter, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Order } from '../../types';
import { VisualOrderTimeline } from '../VisualOrderTimeline';

interface DashboardOrdersProps {
    orders: Order[];
    isLoading: boolean;
    onDownloadInvoice: (orderId: string) => void;
}

export const DashboardOrders: React.FC<DashboardOrdersProps> = ({
    orders,
    isLoading,
    onDownloadInvoice
}) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [orderFilter, setOrderFilter] = useState('all');
    const [orderSearch, setOrderSearch] = useState('');

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesFilter = orderFilter === 'all' || order.status === orderFilter;
        const matchesSearch = orderSearch === '' ||
            order.orderNumber?.toLowerCase().includes(orderSearch.toLowerCase()) ||
            order.items?.some(item => item.name?.toLowerCase().includes(orderSearch.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            case 'processing': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
            case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/30';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-900/50 border border-slate-800 rounded-2xl relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">{t('orders.title', 'My Orders')}</h2>
                    <p className="text-slate-400 text-sm">{t('orders.count', { defaultValue: '{{count}} orders found', count: filteredOrders.length })}</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder={t('orders.search.placeholder', 'Search orders...')}
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <select
                        title="Filter orders by status"
                        value={orderFilter}
                        onChange={(e) => setOrderFilter(e.target.value)}
                        className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                        <option value="all">{t('orders.filter.all', 'All Status')}</option>
                        <option value="pending">{t('orders.status.pending', 'Pending')}</option>
                        <option value="processing">{t('orders.status.processing', 'Processing')}</option>
                        <option value="delivered">{t('orders.status.delivered', 'Delivered')}</option>
                        <option value="cancelled">{t('orders.status.cancelled', 'Cancelled')}</option>
                    </select>
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders.map((order) => (
                    <div
                        key={order._id}
                        className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all"
                    >
                        {/* Order Header */}
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                                        <Package className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{t('orders.item.number', 'Order')} {order.orderNumber || `#${order._id?.slice(-8)}`}</h3>
                                        <p className="text-sm text-slate-400">
                                            {new Date(order.createdAt).toLocaleDateString()} • {t('orders.item.count', { defaultValue: '{{count}} items', count: order.items?.length || 0 })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-white font-bold text-lg">€{order.totalAmount?.toFixed(2)}</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <button
                                        aria-label={expandedOrderId === order._id ? 'Collapse order' : 'Expand order'}
                                        onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        <ChevronRight className={`w-5 h-5 transition-transform ${expandedOrderId === order._id ? 'rotate-90' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Order Details */}
                        {expandedOrderId === order._id && (
                            <div className="px-6 pb-6 animate-in slide-in-from-top-2">
                                <div className="h-px bg-slate-800 mb-4"></div>

                                <div className="mb-6">
                                    <VisualOrderTimeline currentStatus={order.status || 'pending'} type="order" />
                                </div>

                                {/* Order Items */}
                                <div className="space-y-3 mb-4">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-xl">
                                            {item.image && (
                                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                                            )}
                                            <div className="flex-1">
                                                <p className="text-white font-medium">{item.name}</p>
                                                <p className="text-sm text-slate-400">{t('orders.item.qty', 'Qty')}: {item.quantity}</p>
                                            </div>
                                            <p className="text-white font-bold">€{item.price?.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-3">
                                    {(order.paymentMethod === 'bank_transfer' && order.paymentStatus !== 'paid') && (
                                        <button
                                            onClick={() => navigate(`/orders/${order._id}`)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-bold transition-colors"
                                        >
                                            <Upload className="w-4 h-4" />
                                            {t('orders.actions.uploadReceipt', 'Upload Receipt')}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onDownloadInvoice(order._id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        {t('orders.actions.downloadInvoice', 'Download Invoice')}
                                    </button>
                                    <button
                                        onClick={() => navigate(`/orders/${order._id}`)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors"
                                    >
                                        {t('orders.actions.viewDetails', 'View Details')}
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {filteredOrders.length === 0 && (
                    <div className="relative overflow-hidden text-center py-20 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl group transition-all duration-500 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] group-hover:bg-blue-500/20 transition-all duration-700 pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)] flex items-center justify-center mb-6 border border-white/5">
                                <Package className="w-10 h-10 text-blue-400 opacity-80" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{t('orders.empty.title', 'Noch keine Bestellungen')}</h3>
                            <p className="text-base text-slate-400 mb-8 max-w-sm mx-auto">
                                {orderSearch || orderFilter !== 'all' 
                                    ? t('orders.empty.noResults', 'Keine Ergebnisse für deine Suche. Bitte passe die Filter an.') 
                                    : t('orders.empty.newProfile', 'Dein Profil ist noch ganz neu. Entdecke erstklassige Premium-Geräte in unserem Marktplatz!')}
                            </p>
                            {!orderSearch && orderFilter === 'all' && (
                                <button
                                    onClick={() => navigate('/marketplace')}
                                    className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-brand-primary hover:scale-105 active:scale-95 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/30 w-full sm:w-auto flex items-center justify-center gap-2"
                                >
                                    {t('orders.empty.cta', 'Zum Marktplatz')} <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
