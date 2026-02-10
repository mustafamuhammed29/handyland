import React, { useState } from 'react';
import { Package, Download, ChevronRight, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Order } from '../../types';

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
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [orderFilter, setOrderFilter] = useState('all');
    const [orderSearch, setOrderSearch] = useState('');

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesFilter = orderFilter === 'all' || order.status === orderFilter;
        const matchesSearch = orderSearch === '' ||
            order._id?.toLowerCase().includes(orderSearch.toLowerCase()) ||
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
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-800/50 rounded-2xl"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">My Orders</h2>
                    <p className="text-slate-400 text-sm">{filteredOrders.length} orders found</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={orderFilter}
                        onChange={(e) => setOrderFilter(e.target.value)}
                        className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
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
                                        <h3 className="font-bold text-white">Order #{order._id?.slice(-8)}</h3>
                                        <p className="text-sm text-slate-400">
                                            {new Date(order.createdAt).toLocaleDateString()} • {order.items?.length || 0} items
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

                                {/* Order Items */}
                                <div className="space-y-3 mb-4">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-xl">
                                            {item.image && (
                                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                                            )}
                                            <div className="flex-1">
                                                <p className="text-white font-medium">{item.name}</p>
                                                <p className="text-sm text-slate-400">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="text-white font-bold">€{item.price?.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => onDownloadInvoice(order._id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Invoice
                                    </button>
                                    <button
                                        onClick={() => navigate(`/order/${order._id}`)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors"
                                    >
                                        View Details
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {filteredOrders.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No orders found</p>
                        <p className="text-sm">Try adjusting your filters or search</p>
                    </div>
                )}
            </div>
        </div>
    );
};
