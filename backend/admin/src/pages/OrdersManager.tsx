import React, { useEffect } from 'react';
import { Package, FileSpreadsheet, Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import { io } from 'socket.io-client';

import { OrdersStats } from './orders/OrdersStats';
import { OrdersFilters } from './orders/OrdersFilters';
import { OrdersTable } from './orders/OrdersTable';
import { OrderDetailsModal } from './orders/OrderDetailsModal';
import { OrderStatusModal } from './orders/OrderStatusModal';
import { useOrders } from './orders/useOrders';

const OrdersManager: React.FC = () => {
    const {
        orders,
        stats,
        selectedStatus, setSelectedStatus,
        searchTerm, setSearchTerm,
        dateRange, setDateRange,
        page, setPage,
        limit,
        totalPages,
        totalOrdersCount,
        selectedOrder, setSelectedOrder,
        loading,
        selectedOrders,
        showStatusModal, setShowStatusModal,
        statusForm, setStatusForm,
        updatingStatus,
        fetchOrders,
        fetchStats,
        openStatusModal,
        handleStatusUpdate,
        handleApprovePayment,
        handleSelectAll,
        toggleSelectOrder,
        handleBulkStatusChange,
        handleDeleteSelectedOrders,
        handleDeleteSingleOrder,
        handleDownloadInvoice,
        handleCreateInvoice,
        handlePrintPackingSlip,
        handleExportCSV,
        copyToClipboard,
        formatPaymentMethod,
    } = useOrders();

    // Debounced Search & Pagination trigger
    useEffect(() => {
        fetchOrders();
        fetchStats();
    }, [fetchOrders, fetchStats]);

    // Handle Deep Linking (from notifications)
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const orderId = queryParams.get('id');
        
        if (orderId && !loading) {
            const foundOrder = orders.find(o => o._id === orderId);
            if (foundOrder) {
                setSelectedOrder(foundOrder);
            } else {
                api.get(`/api/orders/${orderId}`)
                   .then(res => {
                       if (res.data.success) setSelectedOrder(res.data.order || res.data.data);
                   }).catch(err => console.error("Could not fetch specific order:", err));
            }
            // Clean URL so it doesn't persist
            window.history.replaceState({}, '', '/orders');
        }
    }, [orders, loading, setSelectedOrder]);

    // Socket.io Real-time connection
    useEffect(() => {
        const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
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
    }, [fetchOrders, fetchStats]);

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
            <OrdersStats stats={stats} />
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
                        <button
                            onClick={handleDeleteSelectedOrders}
                            className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors border border-red-500/30 font-medium text-sm flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <OrdersFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                dateRange={dateRange}
                setDateRange={setDateRange}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                setPage={setPage}
            />

            {/* Orders Table */}
            <OrdersTable
                orders={orders}
                loading={loading}
                selectedOrders={selectedOrders}
                handleSelectAll={handleSelectAll}
                toggleSelectOrder={toggleSelectOrder}
                setSelectedOrder={setSelectedOrder}
                handleDeleteSingleOrder={handleDeleteSingleOrder}
                copyToClipboard={copyToClipboard}
                formatPaymentMethod={formatPaymentMethod}
                page={page}
                setPage={setPage}
                limit={limit}
                totalPages={totalPages}
                totalOrdersCount={totalOrdersCount}
                setSearchTerm={setSearchTerm}
                setSelectedStatus={setSelectedStatus}
                setDateRange={setDateRange}
            />

            {/* Order Details Modal */}
            {selectedOrder && (
                <OrderDetailsModal
                    selectedOrder={selectedOrder}
                    setSelectedOrder={setSelectedOrder}
                    handlePrintPackingSlip={handlePrintPackingSlip}
                    handleDownloadInvoice={handleDownloadInvoice}
                    handleCreateInvoice={handleCreateInvoice}
                    copyToClipboard={copyToClipboard}
                    formatPaymentMethod={formatPaymentMethod}
                    handleApprovePayment={handleApprovePayment}
                    openStatusModal={openStatusModal}
                />
            )}

            {/* Status Update Modal */}
            {showStatusModal && selectedOrder && (
                <OrderStatusModal
                    selectedOrder={selectedOrder}
                    statusForm={statusForm}
                    setStatusForm={setStatusForm}
                    setShowStatusModal={setShowStatusModal}
                    handleStatusUpdate={handleStatusUpdate}
                    updatingStatus={updatingStatus}
                />
            )}
        </div>
    );
};

export default OrdersManager;
