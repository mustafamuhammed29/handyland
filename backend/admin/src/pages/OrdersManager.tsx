import React, { useState, useEffect, useCallback } from 'react';
import { Package, Eye, Search, Filter, Truck, CheckCircle, XCircle, Clock, CheckSquare, Square, AlertTriangle, Send, Download, Printer, Copy, FileSpreadsheet, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../utils/api';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import useDebounce from '../hooks/useDebounce';

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
    shippingMethod?: string;
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
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrdersCount, setTotalOrdersCount] = useState(0);

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    
    // Status update modal state
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusForm, setStatusForm] = useState({ status: '', trackingNumber: '', adminNote: '' });
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            let url = `/api/orders/admin/all?page=${page}&limit=${limit}`;
            if (selectedStatus) url += `&status=${selectedStatus}`;
            if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
            if (dateRange.start) url += `&startDate=${dateRange.start}`;
            if (dateRange.end) url += `&endDate=${dateRange.end}`;

            const response = await api.get(url);

            if (response.data.success) {
                setOrders(response.data.orders);
                setTotalPages(response.data.totalPages || 1);
                setTotalOrdersCount(response.data.count || 0);
            }
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
            toast.error('Failed to fetch orders.');
        } finally {
            setLoading(false);
        }
    }, [page, limit, selectedStatus, debouncedSearch, dateRange]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/orders/admin/stats');
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('❌ Error fetching stats:', error);
        }
    };

    // Debounced Search & Pagination trigger
    useEffect(() => {
        fetchOrders();
        fetchStats();
    }, [fetchOrders]);

    // Socket.io Real-time connection
    useEffect(() => {
        const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            auth: { token: sessionStorage.getItem('adminSocketToken') || undefined },
        });

        socket.on('connect', () => {
            socket.emit('join:admin');
        });

        socket.on('admin:notification', (payload: any) => {
            if (payload.type === 'new_order' || payload.type === 'order_updated') {
                // Instantly refresh data when a new order comes in
                fetchOrders();
                fetchStats();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchOrders]);

    const openStatusModal = (order: Order) => {
        setStatusForm({ status: order.status, trackingNumber: order.trackingNumber || '', adminNote: '' });
        setShowStatusModal(true);
    };

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
                toast.success(`Order ${selectedOrder.orderNumber} updated to "${STATUS_CONFIG[statusForm.status]?.label || statusForm.status}"`);
                setShowStatusModal(false);
                setSelectedOrder(null);
                fetchOrders();
                fetchStats();
            }
        } catch (error) {
            console.error('❌ Error updating order:', error);
            toast.error('Failed to update order status.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleApprovePayment = async (orderId: string) => {
        if (!window.confirm('Are you sure you want to approve this bank transfer and mark as paid?')) return;
        try {
            const response = await api.put(`/api/orders/admin/${orderId}/approve-bank-transfer`);
            if (response.data.success) {
                toast.success('Payment approved! Order is now processing.');
                fetchOrders();
                fetchStats();
                setSelectedOrder(null);
            }
        } catch (error) {
            toast.error('Failed to approve payment.');
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
            toast.success(`${selectedOrders.length} orders updated to "${STATUS_CONFIG[newStatus]?.label || newStatus}"`);
            fetchOrders();
            fetchStats();
            setSelectedOrders([]);
        } catch (error) {
            toast.error('Error updating orders. Some may have failed.');
        }
    };

    const handleDownloadInvoice = async (orderId: string, orderNumber: string) => {
        try {
            toast.success('Generating invoice...');
            const res = await api.get(`/api/orders/${orderId}/invoice`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${orderNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            toast.error('Failed to download invoice');
        }
    };

    const handlePrintPackingSlip = (order: Order) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
            <head><title>Packing Slip - ${order.orderNumber}</title>
            <style>
                body { font-family: sans-serif; padding: 40px; color: #111; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #f8f9fa; }
                .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                .ship-to { margin-bottom: 40px; padding: 20px; border: 1px solid #ddd; background: #fdfdfd; max-width: 400px; }
                h2, h3 { margin: 0 0 10px 0; }
                .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h2>HANDYLAND</h2>
                        <p style="color: #666;">Packing Slip</p>
                    </div>
                    <div style="text-align: right;">
                        <h3>Order #${order.orderNumber}</h3>
                        <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="ship-to">
                    <h3>Ship To:</h3>
                    <p style="margin:0; line-height: 1.6;">
                    <strong>${order.shippingAddress.fullName}</strong><br/>
                    ${order.shippingAddress.street}<br/>
                    ${order.shippingAddress.zipCode} ${order.shippingAddress.city}<br/>
                    ${order.shippingAddress.country}<br/>
                    Phone: ${order.shippingAddress.phone}
                    </p>
                </div>
                <table>
                    <tr><th>Item Description</th><th>Quantity</th></tr>
                    ${order.items.map(item => `<tr><td>${item.name}</td><td>${item.quantity}</td></tr>`).join('')}
                </table>
                <div class="footer">Thank you for your order!</div>
                <script>
                    window.onload = function() { window.print(); window.setTimeout(window.close, 500); };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleExportCSV = () => {
        toast.success('Preparing CSV export...');
        const headers = "Order Number,Date,Customer Name,Email,Phone,Items,Total,Status,Payment Method\n";
        const rows = orders.map(o => `"${o.orderNumber}","${new Date(o.createdAt).toLocaleDateString()}","${o.user?.name || ''}","${o.user?.email || ''}","${o.user?.phone || ''}",${o.items.length},${o.totalAmount},"${o.status}","${o.paymentMethod}"`).join('\n');
        const csv = headers + rows;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Orders_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    };

    const formatPaymentMethod = (method: string) => {
        switch (method) {
            case 'bank_transfer': return 'Bank Transfer (Vorkasse)';
            case 'cod': return 'Cash on Delivery';
            case 'cash': return 'Cash on Delivery';
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
        <div className="p-6 max-w-[1600px] mx-auto">

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
                        <div className="p-2 bg-indigo-500/20 rounded-xl">
                            <Package className="w-7 h-7 text-indigo-400" />
                        </div>
                        Orders Management
                    </h1>
                    <p className="text-slate-400 mt-2">Manage customer orders, update statuses, and download invoices.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition-all shadow-sm font-medium text-sm"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-sm">
                        <div className="text-sm font-medium text-slate-400 mb-1">Total Orders</div>
                        <div className="text-3xl font-bold text-white">{stats.totalOrders}</div>
                    </div>
                    <div className="bg-yellow-500/5 backdrop-blur-md p-5 rounded-2xl border border-yellow-500/20 shadow-sm">
                        <div className="text-sm font-medium text-yellow-500/80 mb-1">Pending</div>
                        <div className="text-3xl font-bold text-yellow-400">{stats.pendingOrders}</div>
                    </div>
                    <div className="bg-blue-500/5 backdrop-blur-md p-5 rounded-2xl border border-blue-500/20 shadow-sm">
                        <div className="text-sm font-medium text-blue-500/80 mb-1">Processing</div>
                        <div className="text-3xl font-bold text-blue-400">{stats.processingOrders}</div>
                    </div>
                    <div className="bg-purple-500/5 backdrop-blur-md p-5 rounded-2xl border border-purple-500/20 shadow-sm">
                        <div className="text-sm font-medium text-purple-500/80 mb-1">Shipped</div>
                        <div className="text-3xl font-bold text-purple-400">{stats.shippedOrders}</div>
                    </div>
                    <div className="bg-green-500/5 backdrop-blur-md p-5 rounded-2xl border border-green-500/20 shadow-sm">
                        <div className="text-sm font-medium text-green-500/80 mb-1">Delivered</div>
                        <div className="text-3xl font-bold text-green-400">{stats.deliveredOrders}</div>
                    </div>
                    <div className="bg-red-500/5 backdrop-blur-md p-5 rounded-2xl border border-red-500/20 shadow-sm">
                        <div className="text-sm font-medium text-red-500/80 mb-1">Cancelled</div>
                        <div className="text-3xl font-bold text-red-400">{stats.cancelledOrders}</div>
                    </div>
                    <div className="bg-indigo-500/10 backdrop-blur-md p-5 rounded-2xl border border-indigo-500/30 shadow-sm relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/20 rounded-full blur-xl"></div>
                        <div className="text-sm font-medium text-indigo-400 mb-1 relative z-10">Revenue</div>
                        <div className="text-2xl lg:text-xl xl:text-2xl font-bold text-white relative z-10">€{stats.totalRevenue.toFixed(2)}</div>
                    </div>
                </div>
            )}

            {/* Bulk Actions */}
            {selectedOrders.length > 0 && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <span className="text-indigo-400 font-bold text-sm">{selectedOrders.length}</span>
                        </div>
                        <span className="text-indigo-200 font-medium">orders selected</span>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <select
                            onChange={(e) => handleBulkStatusChange(e.target.value)}
                            value=""
                            className="w-full md:w-auto px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
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
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by order number, customer name, email..."
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-950/50 border border-slate-700/80 rounded-xl px-3 py-1.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <input 
                                type="date" 
                                className="bg-transparent text-sm text-slate-300 focus:outline-none"
                                value={dateRange.start}
                                onChange={e => { setDateRange(prev => ({...prev, start: e.target.value})); setPage(1); }}
                                aria-label="Start Date"
                            />
                            <span className="text-slate-500">-</span>
                            <input 
                                type="date" 
                                className="bg-transparent text-sm text-slate-300 focus:outline-none"
                                value={dateRange.end}
                                onChange={e => { setDateRange(prev => ({...prev, end: e.target.value})); setPage(1); }}
                                aria-label="End Date"
                            />
                        </div>
                        <div className="flex items-center gap-2 relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <Filter className="w-4 h-4 text-slate-400" />
                            </div>
                            <select
                                aria-label="Filter Orders by Status"
                                className="pl-9 pr-8 py-2.5 bg-slate-950/50 border border-slate-700/80 rounded-xl text-white appearance-none focus:outline-none focus:border-indigo-500 transition-all"
                                value={selectedStatus}
                                onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
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
            </div>

            {/* Orders Table */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md">
                            <tr>
                                <th className="px-6 py-4 text-left w-16">
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-slate-500 hover:text-white transition-colors flex items-center"
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
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Order</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Items & Total</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider rounded-tr-2xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loading && orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                            Loading orders...
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <Package className="w-12 h-12 text-slate-700" />
                                            <p className="text-lg font-medium text-slate-400">No orders found matching your criteria</p>
                                            <button onClick={() => { setSearchTerm(''); setSelectedStatus(''); setDateRange({start:'', end:''}); }} className="mt-2 text-indigo-400 hover:text-indigo-300 font-medium text-sm">Clear all filters</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const isSelected = selectedOrders.includes(order._id);
                                    return (
                                        <tr key={order._id} className={`transition-colors hover:bg-slate-800/40 ${isSelected ? 'bg-indigo-500/5' : ''}`}>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleSelectOrder(order._id)}
                                                    className="text-slate-500 hover:text-white transition-colors flex items-center"
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
                                                <div className="flex items-center gap-2 group">
                                                    <span className="font-bold text-white group-hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>{order.orderNumber}</span>
                                                    <button title="Copy Order Number" aria-label="Copy Order Number" onClick={() => copyToClipboard(order.orderNumber, 'Order Number')} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-opacity"><Copy className="w-3.5 h-3.5" /></button>
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-slate-700 inline-block"></span>
                                                    {formatPaymentMethod(order.paymentMethod)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-200">{order.user?.name || 'Guest User'}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">{order.user?.email || 'No Email'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-white">€{order.totalAmount.toFixed(2)}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">{order.items.length} item(s)</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${STATUS_CONFIG[order.status]?.bg || 'bg-slate-800'} ${STATUS_CONFIG[order.status]?.color || 'text-slate-300'} ${STATUS_CONFIG[order.status]?.border || 'border-slate-700'}`}>
                                                    {STATUS_CONFIG[order.status]?.icon || <Clock className="w-3 h-3" />}
                                                    {STATUS_CONFIG[order.status]?.label || order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                                <div className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 rounded-lg font-medium text-sm transition-colors border border-indigo-500/20"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                        <div className="text-sm text-slate-400">
                            Showing <span className="font-medium text-white">{((page - 1) * limit) + 1}</span> to <span className="font-medium text-white">{Math.min(page * limit, totalOrdersCount)}</span> of <span className="font-medium text-white">{totalOrdersCount}</span> results
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                title="Previous Page"
                                aria-label="Previous Page"
                                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:opacity-50 border border-slate-700 rounded-lg transition-colors text-white"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                    // Logic for showing 5 pages window
                                    let pageNum = page - 2 + i;
                                    if (page < 3) pageNum = i + 1;
                                    if (page > totalPages - 2) pageNum = totalPages - 4 + i;
                                    if (pageNum < 1 || pageNum > totalPages) return null;
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`w-9 h-9 rounded-lg font-medium text-sm transition-colors ${page === pageNum ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                title="Next Page"
                                aria-label="Next Page"
                                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:opacity-50 border border-slate-700 rounded-lg transition-colors text-white"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    Order #{selectedOrder.orderNumber}
                                    <button title="Copy Order Number" aria-label="Copy Order Number" onClick={() => copyToClipboard(selectedOrder.orderNumber, 'Order Number')} className="text-slate-500 hover:text-white transition-colors"><Copy className="w-4 h-4" /></button>
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handlePrintPackingSlip(selectedOrder)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition-colors font-medium text-sm"
                                >
                                    <Printer className="w-4 h-4" />
                                    Packing Slip
                                </button>
                                <button
                                    onClick={() => handleDownloadInvoice(selectedOrder._id, selectedOrder.orderNumber)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition-colors font-medium text-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Invoice
                                </button>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            
                            {/* Visual Status Timeline */}
                            <div className="mb-8 p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                                <div className="flex items-center justify-between relative">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-700 z-0 rounded-full"></div>
                                    {['pending', 'processing', 'shipped', 'delivered'].map((step) => {
                                        const statuses = ['pending', 'processing', 'shipped', 'delivered'];
                                        const currentIndex = statuses.indexOf(selectedOrder.status);
                                        const stepIndex = statuses.indexOf(step);
                                        const isCompleted = stepIndex <= currentIndex;
                                        const isCancelled = selectedOrder.status === 'cancelled';
                                        
                                        return (
                                            <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-slate-800 ${isCancelled ? 'bg-red-500' : isCompleted ? 'bg-indigo-500' : 'bg-slate-600'}`}>
                                                    {isCancelled && stepIndex === currentIndex ? <XCircle className="w-4 h-4 text-white" /> : isCompleted ? <CheckCircle className="w-4 h-4 text-white" /> : <div className="w-2 h-2 bg-slate-400 rounded-full" />}
                                                </div>
                                                <span className={`text-xs font-bold uppercase tracking-wider ${isCancelled && stepIndex === currentIndex ? 'text-red-400' : isCompleted ? 'text-indigo-400' : 'text-slate-500'}`}>{step}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Customer Info */}
                                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
                                        Customer Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400 text-sm">Name</span>
                                            <span className="text-white font-medium">{selectedOrder.user?.name || 'Guest'}</span>
                                        </div>
                                        <div className="flex items-center justify-between group">
                                            <span className="text-slate-400 text-sm">Email</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium">{selectedOrder.user?.email || '-'}</span>
                                                {selectedOrder.user?.email && <button title="Copy Email" aria-label="Copy Email" onClick={() => copyToClipboard(selectedOrder.user.email, 'Email')} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-opacity"><Copy className="w-3.5 h-3.5" /></button>}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between group">
                                            <span className="text-slate-400 text-sm">Phone</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium">{selectedOrder.user?.phone || selectedOrder.shippingAddress.phone || '-'}</span>
                                                {(selectedOrder.user?.phone || selectedOrder.shippingAddress.phone) && <button title="Copy Phone" aria-label="Copy Phone" onClick={() => copyToClipboard(selectedOrder.user?.phone || selectedOrder.shippingAddress.phone, 'Phone')} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-opacity"><Copy className="w-3.5 h-3.5" /></button>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Info */}
                                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
                                        Shipping Details
                                    </h3>
                                    <div className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                        <div className="text-white font-bold text-base mb-1">{selectedOrder.shippingAddress.fullName}</div>
                                        <div>{selectedOrder.shippingAddress.street}</div>
                                        <div>{selectedOrder.shippingAddress.zipCode} {selectedOrder.shippingAddress.city}</div>
                                        <div>{selectedOrder.shippingAddress.country}</div>
                                        <div className="mt-2 text-slate-400 pt-2 border-t border-slate-800/80">
                                            Method: <strong className="text-white">{selectedOrder.shippingMethod || 'Standard Delivery'}</strong>
                                        </div>
                                        {selectedOrder.trackingNumber && (
                                            <div className="mt-1 text-slate-400">
                                                Tracking: <strong className="text-indigo-400">{selectedOrder.trackingNumber}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bank Transfer Receipt Section */}
                            {selectedOrder.paymentMethod === 'bank_transfer' && (
                                <div className="mb-6 p-5 border border-blue-500/30 bg-blue-500/10 rounded-2xl">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                        <div>
                                            <h3 className="font-bold text-blue-400 text-lg">Bank Transfer Payment</h3>
                                            <p className="text-sm text-blue-300/80 mt-1">Status: <strong className="uppercase">{selectedOrder.paymentStatus}</strong></p>
                                        </div>
                                        {selectedOrder.paymentStatus !== 'paid' && (
                                            <button
                                                onClick={() => handleApprovePayment(selectedOrder._id)}
                                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-900/20"
                                            >
                                                ✓ Mark as Paid & Approve
                                            </button>
                                        )}
                                    </div>
                                    {selectedOrder.paymentReceipt ? (
                                        <div className="bg-slate-900/50 p-3 rounded-xl border border-blue-500/20 inline-block">
                                            <p className="text-sm text-slate-400 mb-3">Customer uploaded receipt:</p>
                                            <a href={selectedOrder.paymentReceipt} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg">
                                                <img src={selectedOrder.paymentReceipt} alt="Payment Receipt" className="w-full max-w-xs object-cover border border-slate-700 group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Eye className="w-8 h-8 text-white" />
                                                </div>
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-yellow-500/20 text-yellow-400 text-sm">
                                            <Clock className="w-4 h-4 inline mr-2 -mt-0.5" />
                                            Waiting for customer to upload the payment receipt.
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden mb-6">
                                <div className="p-5 border-b border-slate-700/50 bg-slate-900/30">
                                    <h3 className="font-bold text-white text-lg">Order Items</h3>
                                </div>
                                <div className="p-5 space-y-4">
                                    {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg bg-white/5 p-1" />
                                            ) : (
                                                <div className="w-20 h-20 rounded-lg bg-slate-800 flex items-center justify-center"><Package className="w-8 h-8 text-slate-600" /></div>
                                            )}
                                            <div className="flex-1">
                                                <div className="font-bold text-white text-base">{item.name}</div>
                                                <div className="text-sm text-slate-400 mt-1">Quantity: <span className="text-white font-medium">{item.quantity}</span></div>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <div className="font-bold text-white text-lg">€{(item.price * item.quantity).toFixed(2)}</div>
                                                <div className="text-sm text-slate-500">€{item.price.toFixed(2)} each</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-5 bg-slate-900/60 border-t border-slate-700/50 flex justify-end">
                                    <div className="w-full sm:w-1/2 space-y-2">
                                        <div className="flex justify-between text-sm text-slate-400">
                                            <span>Subtotal</span>
                                            <span>€{selectedOrder.totalAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-slate-400">
                                            <span>Shipping</span>
                                            <span>€0.00</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold text-white pt-3 border-t border-slate-700 mt-2">
                                            <span>Total Paid</span>
                                            <span className="text-indigo-400">€{selectedOrder.totalAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedOrder.notes && (
                                <div className="mb-6 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
                                    <h3 className="font-bold text-white mb-3 text-lg">Customer Notes</h3>
                                    <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-slate-300 italic">"{selectedOrder.notes}"</div>
                                </div>
                            )}
                        </div>
                        
                        {/* Modal Footer / Update Button */}
                        <div className="p-6 border-t border-slate-800/80 bg-slate-900">
                            <button
                                onClick={() => openStatusModal(selectedOrder)}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/20"
                            >
                                <Send className="w-5 h-5" />
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
                            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/30 rounded-t-2xl">
                                <div>
                                    <h3 className="font-bold text-xl text-white">Update Status</h3>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">#{selectedOrder.orderNumber} · {selectedOrder.user?.name || 'Guest'}</p>
                                </div>
                                <button onClick={() => setShowStatusModal(false)} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">✕</button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Status Selector */}
                                <div>
                                    <label htmlFor="status-select" className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">New Status</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {Object.entries(STATUS_CONFIG).map(([key, s]) => (
                                            <button
                                                key={key}
                                                onClick={() => setStatusForm(f => ({ ...f, status: key }))}
                                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${statusForm.status === key
                                                    ? `${s.bg} ${s.border} ${s.color} shadow-lg ring-2 ring-offset-2 ring-offset-slate-900 ring-current scale-105`
                                                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300 hover:bg-slate-700'
                                                    }`}
                                            >
                                                <span className={statusForm.status === key ? s.color : 'text-slate-500'}>{s.icon}</span>
                                                <span className="hidden sm:block">{s.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {cfg && (
                                        <div className={`mt-3 p-3 rounded-lg border text-sm flex items-start gap-2 ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                                            {cfg.icon}
                                            <span className="font-medium">{cfg.description}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Tracking Number (Shipped only) */}
                                {isShipped && (
                                    <div className="animate-in slide-in-from-top-2">
                                        <label htmlFor="tracking-input" className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                                            Tracking Number <span className="text-slate-500 font-normal lowercase">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input
                                                id="tracking-input"
                                                type="text"
                                                value={statusForm.trackingNumber}
                                                onChange={e => setStatusForm(f => ({ ...f, trackingNumber: e.target.value.toUpperCase() }))}
                                                placeholder="e.g. 1Z999AA1012345678"
                                                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm font-mono transition-all"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Admin Note to Customer */}
                                <div>
                                    <label htmlFor="admin-note" className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                                        Message to Customer <span className="text-slate-500 font-normal lowercase">(optional)</span>
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
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm resize-none transition-all"
                                    />
                                    {/* Live Preview */}
                                    {statusForm.adminNote && (
                                        <div className="mt-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 animate-in fade-in">
                                            <p className="text-[10px] text-indigo-400 font-bold mb-2 uppercase tracking-wider">Email Preview Component</p>
                                            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                                                <p className="text-xs text-slate-400 font-medium mb-1">Message from HandyLand</p>
                                                <p className="text-sm text-slate-200">"{statusForm.adminNote}"</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Cancellation Warning */}
                                {isCancelled && (
                                    <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-in slide-in-from-bottom-2">
                                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-200/90 leading-relaxed">
                                            <strong className="text-red-400">Warning:</strong> Cancelling this order will restore the product stock automatically. This action cannot be undone.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-800 bg-slate-800/30 rounded-b-2xl flex gap-3">
                                <button
                                    onClick={() => setShowStatusModal(false)}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl font-bold transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStatusUpdate}
                                    disabled={updatingStatus || statusForm.status === selectedOrder.status}
                                    className={`flex-1 py-3 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:shadow-none ${isCancelled
                                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
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
