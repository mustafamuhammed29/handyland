import React, { useState, useEffect } from 'react';
import { Package, Eye, Search, Filter, Truck, CheckCircle, XCircle, Clock, CheckSquare, Square } from 'lucide-react';
import { api } from '../utils/api';



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

    // Fetch orders
    const fetchOrders = async () => {
        try {
            console.log('📦 Fetching orders...');
            const response = await api.get('/orders/admin/all' + (selectedStatus ? `?status=${selectedStatus}` : ''));

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
            const response = await api.get('/orders/admin/stats');
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

    // Update order status
    const updateStatus = async (orderId: string, newStatus: string, trackingNumber?: string) => {
        try {
            const response = await api.put(`/orders/admin/${orderId}/status`, {
                status: newStatus,
                trackingNumber
            });

            if (response.data.success) {
                alert('Order status updated successfully!');
                fetchOrders();
                fetchStats();
                setSelectedOrder(null);
            }
        } catch (error) {
            console.error('❌ Error updating order:', error);
            alert('Error updating order status');
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
                api.put(`/orders/admin/${id}/status`, { status: newStatus })
            ));
            alert('Orders updated successfully!');
            fetchOrders();
            fetchStats();
            setSelectedOrders([]);
        } catch (error) {
            console.error('❌ Error in bulk status update:', error);
            alert('Error updating orders');
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

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Package className="w-8 h-8" />
                    Orders Management
                </h1>
            </div>

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-sm text-gray-600">Total Orders</div>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-200">
                        <div className="text-sm text-yellow-700">Pending</div>
                        <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
                        <div className="text-sm text-blue-700">Processing</div>
                        <div className="text-2xl font-bold text-blue-600">{stats.processingOrders}</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg shadow border border-purple-200">
                        <div className="text-sm text-purple-700">Shipped</div>
                        <div className="text-2xl font-bold text-purple-600">{stats.shippedOrders}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
                        <div className="text-sm text-green-700">Delivered</div>
                        <div className="text-2xl font-bold text-green-600">{stats.deliveredOrders}</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg shadow border border-red-200">
                        <div className="text-sm text-red-700">Cancelled</div>
                        <div className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg shadow border border-indigo-200">
                        <div className="text-sm text-indigo-700">Revenue</div>
                        <div className="text-xl font-bold text-indigo-600">€{stats.totalRevenue.toFixed(2)}</div>
                    </div>
                </div>
            )}

            {/* Bulk Actions */}
            {selectedOrders.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-2">
                        <span className="text-indigo-700 font-bold">{selectedOrders.length}</span>
                        <span className="text-indigo-900">orders selected</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            onChange={(e) => handleBulkStatusChange(e.target.value)}
                            value=""
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
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
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by order number, customer..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-600" />
                        <select
                            aria-label="Filter Orders by Status"
                            className="px-4 py-2 border border-gray-300 rounded-lg"
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
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left w-16">
                                <button
                                    onClick={handleSelectAll}
                                    className="text-gray-400 hover:text-gray-600 transition-colors flex items-center"
                                    aria-label={selectedOrders.length === orders.length && orders.length > 0 ? "Deselect All" : "Select All"}
                                    title={selectedOrders.length === orders.length && orders.length > 0 ? "Deselect All" : "Select All"}
                                >
                                    {selectedOrders.length === orders.length && orders.length > 0 ? (
                                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                                    ) : (
                                        <Square className="w-5 h-5" />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredOrders.map((order) => {
                            const isSelected = selectedOrders.includes(order._id);
                            return (
                                <tr key={order._id} className={`transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleSelectOrder(order._id)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors flex items-center"
                                            aria-label={isSelected ? "Deselect Order" : "Select Order"}
                                        >
                                            {isSelected ? (
                                                <CheckSquare className="w-5 h-5 text-indigo-600" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{order.orderNumber}</div>
                                        <div className="text-sm text-gray-500">{order.paymentMethod}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{order.user?.name || 'Unknown User'}</div>
                                        <div className="text-sm text-gray-500">{order.user?.email || 'No Email'}</div>
                                        <div className="text-sm text-gray-500">{order.user?.phone || 'No Phone'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {order.items.length} item(s)
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-semibold text-gray-900">€{order.totalAmount.toFixed(2)}</div>
                                        <div className="text-xs text-gray-500">{order.paymentStatus}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Order Details</h2>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="font-semibold mb-2">Order Information</h3>
                                    <div className="space-y-1 text-sm">
                                        <div><span className="text-gray-600">Order Number:</span> <strong>{selectedOrder.orderNumber}</strong></div>
                                        <div><span className="text-gray-600">Date:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
                                        <div><span className="text-gray-600">Status:</span> <span className={`px-2 py-1 rounded text-white ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span></div>
                                        <div><span className="text-gray-600">Payment:</span> {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})</div>
                                        {selectedOrder.trackingNumber && (
                                            <div><span className="text-gray-600">Tracking:</span> {selectedOrder.trackingNumber}</div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                                    <div className="text-sm">
                                        <div>{selectedOrder.shippingAddress.fullName}</div>
                                        <div>{selectedOrder.shippingAddress.phone}</div>
                                        <div>{selectedOrder.shippingAddress.street}</div>
                                        <div>{selectedOrder.shippingAddress.zipCode} {selectedOrder.shippingAddress.city}</div>
                                        <div>{selectedOrder.shippingAddress.country}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-semibold mb-2">Items</h3>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                                            {item.image && (
                                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                                            )}
                                            <div className="flex-1">
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold">€{(item.price * item.quantity).toFixed(2)}</div>
                                                <div className="text-sm text-gray-600">€{item.price.toFixed(2)} each</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-right mt-4 text-xl font-bold">
                                    Total: €{selectedOrder.totalAmount.toFixed(2)}
                                </div>
                            </div>

                            {selectedOrder.notes && (
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-2">Notes</h3>
                                    <div className="p-3 bg-gray-50 rounded text-sm">{selectedOrder.notes}</div>
                                </div>
                            )}

                            <div>
                                <h3 className="font-semibold mb-2">Update Status</h3>
                                <div className="flex gap-2">
                                    {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => updateStatus(selectedOrder._id, status)}
                                            className={`px-4 py-2 rounded ${selectedOrder.status === status ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersManager;
