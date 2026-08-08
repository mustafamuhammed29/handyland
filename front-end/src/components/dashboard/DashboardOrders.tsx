import React, { useState } from 'react';
import { Package, Download, ChevronRight, Search, Filter, Upload, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Order } from '../../types';
import { VisualOrderTimeline } from '../VisualOrderTimeline';
import { formatPrice } from '../../utils/formatPrice';

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
            case 'shipped': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
            case 'return_requested': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
            case 'refunded': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
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
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('orders.title', 'Meine Bestellungen')}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{t('orders.found', '{{count}} Bestellungen gefunden', { count: filteredOrders.length })}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder={t('orders.search', 'Bestellungen suchen...')}
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            className="w-full sm:w-auto pl-10 pr-4 py-2 bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-primary dark:focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all backdrop-blur-md shadow-sm"
                        />
                    </div>
                    <select
                        title="Filter orders by status"
                        value={orderFilter}
                        onChange={(e) => setOrderFilter(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-primary dark:focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all backdrop-blur-md shadow-sm"
                    >
                        <option value="all">{t('orders.all_status', 'Alle Status')}</option>
                        <option value="pending">{t('orders.status.pending', 'Ausstehend')}</option>
                        <option value="processing">{t('orders.status.processing', 'In Bearbeitung')}</option>
                        <option value="shipped">{t('orders.status.shipped', 'Versandt')}</option>
                        <option value="delivered">{t('orders.status.delivered', 'Geliefert')}</option>
                        <option value="return_requested">{t('orders.status.return_requested', 'Rückgabe beantragt')}</option>
                        <option value="refunded">{t('orders.status.refunded', 'Rückerstattet')}</option>
                        <option value="cancelled">{t('orders.status.cancelled', 'Storniert')}</option>
                    </select>
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders.map((order) => (
                    <div
                        key={order._id}
                        className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden hover:border-brand-primary/30 dark:hover:border-brand-primary/30 transition-all shadow-sm hover:shadow-md dark:hover:shadow-brand-primary/5"
                    >
                        {/* Order Header */}
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-brand-primary/10 flex items-center justify-center shrink-0 border border-slate-200 dark:border-brand-primary/20">
                                        <Package className="w-6 h-6 text-slate-600 dark:text-brand-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">{t('orders.orderLabel', 'Bestellung')} {order.orderNumber || `#${order._id?.slice(-8)}`}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '---'} • {t('orders.items', '{{count}} Artikel', { count: order.items?.length || 0 })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between md:justify-end gap-4">
                                    <div className="text-right flex-1 md:flex-initial">
                                        <p className="text-slate-900 dark:text-white font-black text-lg">{formatPrice(order.totalAmount || 0)}</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                            {order.status === 'return_requested' && <RotateCcw className="w-3 h-3 inline mr-1" />}
                                            {t(`orders.status.${order.status}`, order.status)}
                                        </span>
                                    </div>
                                    <button
                                        aria-label={expandedOrderId === order._id ? 'Collapse order' : 'Expand order'}
                                        onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white transition-all shrink-0"
                                    >
                                        <ChevronRight className={`w-5 h-5 transition-transform ${expandedOrderId === order._id ? 'rotate-90' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Order Details */}
                        {expandedOrderId === order._id && (
                            <div className="px-6 pb-6 animate-in slide-in-from-top-2">
                                <div className="h-px bg-slate-200 dark:bg-slate-800 mb-6"></div>

                                <div className="mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <VisualOrderTimeline currentStatus={order.status || 'pending'} type="order" />
                                </div>

                                {/* Order Items */}
                                <div className="space-y-3 mb-6">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-3 bg-white/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                            {item.image && (
                                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
                                            )}
                                            <div className="flex-1">
                                                <p className="text-slate-900 dark:text-white font-bold text-sm sm:text-base">{item.name}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{t('orders.item.qty', 'Menge')}: {item.quantity} × {formatPrice(item.price || 0)}</p>
                                            </div>
                                            <p className="text-slate-900 dark:text-white font-black">{formatPrice((item.price || 0) * (item.quantity || 1))}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                                    {(order.paymentMethod === 'bank_transfer' && order.paymentStatus !== 'paid') && (
                                        <button
                                            onClick={() => navigate(`/orders/${order._id}`)}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/30 rounded-xl text-sm font-bold transition-colors"
                                        >
                                            <Upload className="w-4 h-4" />
                                            {t('orders.actions.uploadReceipt', 'Beleg hochladen')}
                                        </button>
                                    )}
                                    {order.hasInvoice && (
                                        <button
                                            onClick={() => onDownloadInvoice(order._id)}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            {t('orders.actions.downloadInvoice', 'Rechnung herunterladen')}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => navigate(`/orders/${order._id}`)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-brand-primary dark:hover:bg-brand-secondary dark:text-black rounded-xl text-sm font-bold transition-colors ml-0 sm:ml-auto"
                                    >
                                        {t('orders.actions.viewDetails', 'Details anzeigen')}
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {filteredOrders.length === 0 && (
                    <div className="relative overflow-hidden text-center py-20 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl group transition-all duration-500 hover:shadow-xl hover:border-brand-primary/30 dark:hover:shadow-brand-primary/5">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-full blur-[60px] group-hover:bg-brand-primary/10 dark:group-hover:bg-brand-primary/20 transition-all duration-700 pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-brand-primary/20 shadow-inner dark:shadow-[0_0_30px_rgba(6,182,212,0.15)] flex items-center justify-center mb-6 border border-slate-200 dark:border-white/5">
                                <Package className="w-10 h-10 text-slate-400 dark:text-brand-primary opacity-80" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{t('orders.empty.title', 'Noch keine Bestellungen')}</h3>
                            <p className="text-base text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto px-4">
                                {orderSearch || orderFilter !== 'all' 
                                    ? t('orders.empty.noResults', 'Keine Ergebnisse für deine Suche. Bitte passe die Filter an.') 
                                    : t('orders.empty.newProfile', 'Dein Profil ist noch ganz neu. Entdecke erstklassige Premium-Geräte in unserem Marktplatz!')}
                            </p>
                            {!orderSearch && orderFilter === 'all' && (
                                <button
                                    onClick={() => navigate('/marketplace')}
                                    className="px-8 py-3.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-gradient-to-r dark:from-brand-primary dark:to-brand-secondary dark:text-black dark:hover:scale-105 active:scale-95 rounded-xl text-sm font-bold transition-all shadow-lg dark:shadow-brand-primary/20 w-[90%] sm:w-auto flex items-center justify-center gap-2"
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
