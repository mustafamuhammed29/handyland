import React, { useState, useEffect } from 'react';
import { Package, Eye, Search, Filter, Truck, CheckCircle, XCircle, Clock, CheckSquare, Square, AlertTriangle, Send } from 'lucide-react';
import { api } from '../utils/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; description: string }> = {
    pending: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: <Clock className="w-4 h-4" />, description: 'Order received, awaiting processing.' },
    processing: { label: 'Processing', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: <Package className="w-4 h-4" />, description: 'Order is being prepared.' },
    shipped: { label: 'Shipped', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: <Truck className="w-4 h-4" />, description: 'Order has been shipped.' },
    delivered: { label: 'Delivered', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: <CheckCircle className="w-4 h-4" />, description: 'Order delivered successfully.' },
    cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <XCircle className="w-4 h-4" />, description: 'Order has been cancelled.' },
};



interface OrderItem {
    product: string;
    productType: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
}

interface Order {
    _id: string;
    orderNumber: string;
    user: {
        _id: string;
        name: string;
        email: string;
        phone: string;
    };
    items: OrderItem[];
    totalAmount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentMethod: string;
    paymentStatus: string;
    paymentReceipt?: string;
    shippingAddress: {
        fullName: string;
        phone: string;
        street: string;
        city: string;
        zipCode: string;
        country: string;
    };
    trackingNumber?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

interface Stats {
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
}

const OrdersManager: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    // Status update modal state
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusForm, setStatusForm] = useState({ status: '', trackingNumber: '', adminNote: '' });
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 3500);
    };

    // Fetch orders
    const fetchOrders = async () => {
        try {
            console.log('📦 Fetching orders...');
            const response = await api.get('/api/orders/admin/all' + (selectedStatus ? `?status=${selectedStatus}` : ''));

            if (response.data.success) {
                setOrders(response.data.orders);
                console.log(`✅ Loaded ${response.data.orders.length} orders`);
            }
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
        }
    };

    // Fetch stats
    const fetchStats = async () => {
        try {
            const response = await api.get('/api/orders/admin/stats');
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('❌ Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchStats();
    }, [selectedStatus]);

    // Open status update modal
    const openStatusModal = (order: Order) => {
        setStatusForm({ status: order.status, trackingNumber: order.trackingNumber || '', adminNote: '' });
        setShowStatusModal(true);
    };

    // Submit status update
    const handleStatusUpdate = async () => {
        if (!selectedOrder || !statusForm.status) return;
        setUpdatingStatus(true);
        try {
            const response = await api.put(`/api/orders/admin/${selectedOrder._id}/status`, {
                status: statusForm.status,
                trackingNumber: statusForm.trackingNumber || undefined,
                adminNote: statusForm.adminNote || undefined,
            });
            if (response.data.success) {
                showToast('success', `Order ${selectedOrder.orderNumber} updated to "${STATUS_CONFIG[statusForm.status]?.label || statusForm.status}"`);
                setShowStatusModal(false);
                setSelectedOrder(null);
                fetchOrders();
                fetchStats();
            }
        } catch (error) {
            console.error('❌ Error updating order:', error);
            showToast('error', 'Failed to update order status. Please try again.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Approve Bank Transfer Payment
    const handleApprovePayment = async (orderId: string) => {
        if (!window.confirm('Are you sure you want to approve this bank transfer and mark as paid?')) return;

        try {
            const response = await api.put(`/api/orders/admin/${orderId}/approve-bank-transfer`);
            if (response.data.success) {
                showToast('success', 'Payment approved! Order is now processing.');
                fetchOrders();
                fetchStats();
                setSelectedOrder(null);
            }
        } catch (error) {
            console.error('❌ Error approving payment:', error);
            showToast('error', 'Failed to approve payment.');
        }
    };

    const handleSelectAll = () => {
        if (selectedOrders.length === orders.length && orders.length > 0) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(orders.map(o => o._id));
        }
    };

    const toggleSelectOrder = (id: string) => {
        if (selectedOrders.includes(id)) {
            setSelectedOrders(selectedOrders.filter(oId => oId !== id));
        } else {
            setSelectedOrders([...selectedOrders, id]);
        }
    };

    const handleBulkStatusChange = async (newStatus: string) => {
        if (!newStatus) return;
        if (!window.confirm(`Change status of ${selectedOrders.length} orders to ${newStatus}?`)) return;

        try {
            await Promise.all(selectedOrders.map(id =>
                api.put(`/api/orders/admin/${id}/status`, { status: newStatus })
            ));
            showToast('success', `${selectedOrders.length} orders updated to "${STATUS_CONFIG[newStatus]?.label || newStatus}"`);
            fetchOrders();
            fetchStats();
            setSelectedOrders([]);
        } catch (error) {
            console.error('❌ Error in bulk status update:', error);
            showToast('error', 'Error updating orders. Some may have failed.');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500';
            case 'processing': return 'bg-blue-500';
            case 'shipped': return 'bg-purple-500';
            case 'delivered': return 'bg-green-500';
            case 'cancelled': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-5 h-5" />;
            case 'processing': return <Package className="w-5 h-5" />;
            case 'shipped': return <Truck className="w-5 h-5" />;
            case 'delivered': return <CheckCircle className="w-5 h-5" />;
            case 'cancelled': return <XCircle className="w-5 h-5" />;
            default: return <Package className="w-5 h-5" />;
        }
    };

    const filteredOrders = orders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    const formatPaymentMethod = (method: string) => {
        switch (method) {
            case 'bank_transfer': return 'Bank Transfer (Vorkasse)';
            case 'cod': return 'Cash on Delivery (Nachnahme)';
            case 'cash': return 'Cash on Delivery (Nachnahme)'; // Fallback just in case
            case 'stripe': return 'Credit Card (Stripe)';
            case 'paypal': return 'PayPal';
            case 'klarna': return 'Klarna';
            case 'giropay': return 'Giropay';
            case 'sepa_debit': return 'SEPA Direct Debit';
            case 'sofort': return 'Sofort';
            default: return method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Unknown';
        }
    };

    return (
        <div className="p-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-right-4 ${toast.type === 'success'
                    ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-900/90 border-red-500/50 text-red-300'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    {toast.text}
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Package className="w-8 h-8" />
                    Orders Management
                </h1>
            </div>

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <div className="text-sm text-slate-400">Total Orders</div>
                        <div className="text-2xl font-bold text-white">{stats.totalOrders}</div>
                    </div>
                    <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/30">
                        <div className="text-sm text-yellow-500">Pending</div>
                        <div className="text-2xl font-bold text-yellow-400">{stats.pendingOrders}</div>
                    </div>
                    <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30">
                        <div className="text-sm text-blue-500">Processing</div>
                        <div className="text-2xl font-bold text-blue-400">{stats.processingOrders}</div>
                    </div>
                    <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/30">
                        <div className="text-sm text-purple-500">Shipped</div>
                        <div className="text-2xl font-bold text-purple-400">{stats.shippedOrders}</div>
                    </div>
                    <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/30">
                        <div className="text-sm text-green-500">Delivered</div>
                        <div className="text-2xl font-bold text-green-400">{stats.deliveredOrders}</div>
                    </div>
                    <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30">
                        <div className="text-sm text-red-500">Cancelled</div>
                        <div className="text-2xl font-bold text-red-400">{stats.cancelledOrders}</div>
                    </div>
                    <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/30">
                        <div className="text-sm text-indigo-400">Revenue</div>
                        <div className="text-xl font-bold text-indigo-300">€{stats.totalRevenue.toFixed(2)}</div>
                    </div>
                </div>
            )}

            {/* Bulk Actions */}
            {selectedOrders.length > 0 && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 mb-6 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-2">
                        <span className="text-indigo-400 font-bold">{selectedOrders.length}</span>
                        <span className="text-indigo-300">orders selected</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            onChange={(e) => handleBulkStatusChange(e.target.value)}
                            value=""
                            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            aria-label="Bulk Change Status"
                        >
                            <option value="" disabled>Change Status To...</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by order number, customer..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-slate-400" />
                        <select
                            aria-label="Filter Orders by Status"
                            className="px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-950/50 border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-3 text-left w-16">
                                <button
                                    onClick={handleSelectAll}
                                    className="text-slate-400 hover:text-white transition-colors flex items-center"
                                    aria-label={selectedOrders.length === orders.length && orders.length > 0 ? "Deselect All" : "Select All"}
                                    title={selectedOrders.length === orders.length && orders.length > 0 ? "Deselect All" : "Select All"}
                                >
                                    {selectedOrders.length === orders.length && orders.length > 0 ? (
                                        <CheckSquare className="w-5 h-5 text-indigo-400" />
                                    ) : (
                                        <Square className="w-5 h-5" />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Order</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredOrders.map((order) => {
                            const isSelected = selectedOrders.includes(order._id);
                            return (
                                <tr key={order._id} className={`transition-colors ${isSelected ? 'bg-indigo-500/10' : 'hover:bg-slate-800/20'}`}>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleSelectOrder(order._id)}
                                            className="text-slate-400 hover:text-white transition-colors flex items-center"
                                            aria-label={isSelected ? "Deselect Order" : "Select Order"}
                                        >
                                            {isSelected ? (
                                                <CheckSquare className="w-5 h-5 text-indigo-400" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-bold text-white">{order.orderNumber}</div>
                                        <div className="text-sm text-slate-400">{formatPaymentMethod(order.paymentMethod)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{order.user?.name || 'Unknown User'}</div>
                                        <div className="text-sm text-slate-400">{order.user?.email || 'No Email'}</div>
                                        <div className="text-sm text-slate-400">{order.user?.phone || 'No Phone'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {order.items.length} item(s)
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-bold text-white">€{order.totalAmount.toFixed(2)}</div>
                                        <div className="text-xs text-slate-500">{order.paymentStatus}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredOrders.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No orders found
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">Order Details</h2>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="font-bold text-white mb-2">Order Information</h3>
                                    <div className="space-y-1 text-sm text-slate-300">
                                        <div><span className="text-slate-500">Order Number:</span> <strong className="text-white">{selectedOrder.orderNumber}</strong></div>
                                        <div><span className="text-slate-500">Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
                                        <div><span className="text-slate-500">Status:</span> <span className={`px-2 py-1 rounded text-white font-bold text-xs uppercase ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span></div>
                                        <div><span className="text-slate-500">Payment:</span> {formatPaymentMethod(selectedOrder.paymentMethod)} ({selectedOrder.paymentStatus})</div>
                                        {selectedOrder.trackingNumber && (
                                            <div><span className="text-slate-500">Tracking:</span> {selectedOrder.trackingNumber}</div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-white mb-2">Shipping Address</h3>
                                    <div className="text-sm text-slate-300">
                                        <div className="text-white font-bold">{selectedOrder.shippingAddress.fullName}</div>
                                        <div>{selectedOrder.shippingAddress.phone}</div>
                                        <div>{selectedOrder.shippingAddress.street}</div>
                                        <div>{selectedOrder.shippingAddress.zipCode} {selectedOrder.shippingAddress.city}</div>
                                        <div>{selectedOrder.shippingAddress.country}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Transfer Receipt Section */}
                            {selectedOrder.paymentMethod === 'bank_transfer' && (
                                <div className="mb-6 p-4 border border-blue-500/30 bg-blue-500/10 rounded-xl">
                                    <h3 className="font-bold text-blue-400 mb-2 flex items-center justify-between">
                                        Bank Transfer Details
                                        {selectedOrder.paymentStatus !== 'paid' && (
                                            <button
                                                onClick={() => handleApprovePayment(selectedOrder._id)}
                                                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                                            >
                                                ✓ Approve Payment
                                            </button>
                                        )}
                                    </h3>
                                    {selectedOrder.paymentReceipt ? (
                                        <div className="mt-3">
                                            <p className="text-sm text-slate-300 mb-2">Customer has uploaded a payment receipt:</p>
                                            <a href={selectedOrder.paymentReceipt} target="_blank" rel="noreferrer">
                                                <img src={selectedOrder.paymentReceipt} alt="Payment Receipt" className="w-full max-w-sm rounded border border-slate-700 hover:opacity-90 transition-opacity" />
                                            </a>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-yellow-400">Waiting for customer to upload payment receipt.</p>
                                    )}
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="font-bold text-white mb-2">Items</h3>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4 p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                                            {item.image && (
                                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded bg-slate-900" />
                                            )}
                                            <div className="flex-1">
                                                <div className="font-bold text-white">{item.name}</div>
                                                <div className="text-sm text-slate-400">Quantity: {item.quantity}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-white">€{(item.price * item.quantity).toFixed(2)}</div>
                                                <div className="text-sm text-slate-400">€{item.price.toFixed(2)} each</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-right mt-4 text-xl font-bold text-white border-t border-slate-800 pt-4">
                                    Total: €{selectedOrder.totalAmount.toFixed(2)}
                                </div>
                            </div>

                            {selectedOrder.notes && (
                                <div className="mb-6">
                                    <h3 className="font-bold text-white mb-2">Notes</h3>
                                    <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300">{selectedOrder.notes}</div>
                                </div>
                            )}

                            {/* Update Status Button */}
                            <button
                                onClick={() => openStatusModal(selectedOrder)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all"
                            >
                                <Send className="w-4 h-4" />
                                Update Order Status
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ── Smart Status Update Modal ── */}
            {showStatusModal && selectedOrder && (() => {
                const cfg = STATUS_CONFIG[statusForm.status];
                const isShipped = statusForm.status === 'shipped';
                const isCancelled = statusForm.status === 'cancelled';
                return (
                    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
                            {/* Header */}
                            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-lg text-white">Update Order Status</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">#{selectedOrder.orderNumber} · {selectedOrder.user?.name}</p>
                                </div>
                                <button onClick={() => setShowStatusModal(false)} aria-label="Close" className="text-slate-500 hover:text-white transition-colors">✕</button>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Status Selector */}
                                <div>
                                    <label htmlFor="status-select" className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">New Status</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {Object.entries(STATUS_CONFIG).map(([key, s]) => (
                                            <button
                                                key={key}
                                                onClick={() => setStatusForm(f => ({ ...f, status: key }))}
                                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${statusForm.status === key
                                                    ? `${s.bg} ${s.border} ${s.color} ring-2 ring-offset-1 ring-offset-slate-900 ring-current`
                                                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                                                    }`}
                                            >
                                                <span className={statusForm.status === key ? s.color : 'text-slate-500'}>{s.icon}</span>
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                    {cfg && (
                                        <p className={`text-xs mt-2 ${cfg.color}`}>→ {cfg.description}</p>
                                    )}
                                </div>

                                {/* Tracking Number (Shipped only) */}
                                {isShipped && (
                                    <div>
                                        <label htmlFor="tracking-input" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                                            Tracking Number <span className="text-slate-600 font-normal">(optional)</span>
                                        </label>
                                        <input
                                            id="tracking-input"
                                            type="text"
                                            value={statusForm.trackingNumber}
                                            onChange={e => setStatusForm(f => ({ ...f, trackingNumber: e.target.value.toUpperCase() }))}
                                            placeholder="e.g. 1Z999AA1012345678"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 text-sm font-mono"
                                        />
                                    </div>
                                )}

                                {/* Admin Note to Customer */}
                                <div>
                                    <label htmlFor="admin-note" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                        <Send className="w-3 h-3" /> Message to Customer <span className="text-slate-600 font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        id="admin-note"
                                        value={statusForm.adminNote}
                                        onChange={e => setStatusForm(f => ({ ...f, adminNote: e.target.value }))}
                                        placeholder={
                                            isShipped ? "e.g. Your package is on its way via DHL Express!" :
                                                isCancelled ? "e.g. We're sorry, your order was cancelled due to stock issues." :
                                                    "Add a personal message for the customer..."
                                        }
                                        rows={3}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm resize-none"
                                    />
                                    {/* Live Preview */}
                                    {statusForm.adminNote && (
                                        <div className="mt-2 bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                                            <p className="text-xs text-indigo-400 font-bold mb-1.5 uppercase tracking-wider">Email Preview</p>
                                            <div className="bg-blue-950/40 border border-blue-500/20 rounded-lg p-2.5">
                                                <p className="text-xs text-blue-300 font-bold mb-0.5">Message from our team</p>
                                                <p className="text-xs text-slate-300 italic">"{statusForm.adminNote}"</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Cancellation Warning */}
                                {isCancelled && (
                                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-red-300">
                                            <strong>Warning:</strong> Cancelling this order will restore stock and notify the customer via email.
                                            This action cannot be undone.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-5 border-t border-slate-800 flex gap-3">
                                <button
                                    onClick={() => setShowStatusModal(false)}
                                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStatusUpdate}
                                    disabled={updatingStatus || statusForm.status === selectedOrder.status}
                                    className={`flex-1 py-2.5 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-40 ${isCancelled
                                        ? 'bg-red-600 hover:bg-red-500 text-white'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                        }`}
                                >
                                    {updatingStatus
                                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</>
                                        : <><Send className="w-4 h-4" /> Confirm Update</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default OrdersManager;
