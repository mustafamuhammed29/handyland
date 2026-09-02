import { useState, useCallback } from 'react';
import { useConfirm } from '../../context/ConfirmContext';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import useDebounce from '../../hooks/useDebounce';
import type { Order, Stats } from './types';
import { STATUS_CONFIG } from './types';
import { formatDate } from '../../utils/formatDate';

export const useOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const { confirm } = useConfirm();
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
                const fetchedOrders = response.data.orders || response.data.data || [];
                setOrders(Array.isArray(fetchedOrders) ? fetchedOrders : []);
                setTotalPages(response.data.totalPages || response.data.pagination?.pages || 1);
                setTotalOrdersCount(response.data.count || 0);
            } else if (Array.isArray(response.data)) {
                setOrders(response.data);
            } else if (response.data && Array.isArray(response.data.data)) {
                setOrders(response.data.data);
            }
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
            toast.error('Failed to fetch orders.');
        } finally {
            setLoading(false);
        }
    }, [page, limit, selectedStatus, debouncedSearch, dateRange]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await api.get('/api/orders/admin/stats');
            if (response.data.success) {
                const s = response.data.data || response.data.stats || {};
                setStats({
                    totalOrders: s.total || s.totalOrders || 0,
                    pendingOrders: s.pending || s.pendingOrders || 0,
                    processingOrders: s.processing || s.processingOrders || 0,
                    shippedOrders: s.shipped || s.shippedOrders || 0,
                    deliveredOrders: s.delivered || s.deliveredOrders || 0,
                    cancelledOrders: s.cancelled || s.cancelledOrders || 0,
                    totalRevenue: s.totalRevenue || 0
                });
            }
        } catch (error) {
            console.error('❌ Error fetching stats:', error);
        }
    }, []);

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
        const ok = await confirm({ message: 'Are you sure you want to approve this bank transfer and mark as paid?', variant: "danger" });
        if (!ok) return;
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
        const ok = await confirm({ message: `Change status of ${selectedOrders.length} orders to ${newStatus}?`, variant: "danger" });
        if (!ok) return;

        try {
            const results = await Promise.allSettled(selectedOrders.map(id =>
                api.put(`/api/orders/admin/${id}/status`, { status: newStatus })
            ));
            
            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (failed > 0) {
                toast.error(`Failed to update ${failed} orders.`);
            }
            if (succeeded > 0) {
                toast.success(`${succeeded} orders updated to "${STATUS_CONFIG[newStatus]?.label || newStatus}"`);
            }
            
            fetchOrders();
            fetchStats();
            setSelectedOrders([]);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteSelectedOrders = async () => {
        if (selectedOrders.length === 0) return toast.error('No orders selected to delete.');
        const ok = await confirm({ message: `Are you sure you want to PERMANENTLY delete ${selectedOrders.length} orders? This cannot be undone.`, variant: "danger" });
        if (!ok) return;

        try {
            const results = await Promise.allSettled(selectedOrders.map(id =>
                api.delete(`/api/orders/admin/${id}`)
            ));
            
            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            if (failed > 0) {
                toast.error(`Failed to delete ${failed} orders.`);
            }
            if (succeeded > 0) {
                toast.success(`${succeeded} orders deleted successfully.`);
            }
            
            setSelectedOrders([]);
            fetchOrders();
            fetchStats();
        } catch (error) {
            console.error('❌ Error deleting orders:', error);
        }
    };

    const handleDeleteSingleOrder = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const ok = await confirm({ message: 'Are you sure you want to PERMANENTLY delete this order? This cannot be undone.', variant: "danger" });
        if (!ok) return;
        try {
            await api.delete(`/api/orders/admin/${id}`);
            toast.success('Order deleted successfully');
            fetchOrders();
            fetchStats();
            if (selectedOrder?._id === id) setSelectedOrder(null);
        } catch (error) {
            toast.error('Error deleting order');
        }
    };

    const handleDownloadInvoice = async (orderId: string, orderNumber: string) => {
        try {
            toast.success('Downloading invoice...');
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

    const handleCreateInvoice = async (orderId: string) => {
        try {
            setLoading(true);
            const res = await api.post(`/api/orders/admin/${orderId}/generate-invoice`);
            if (res.data.success) {
                toast.success('Invoice generated successfully!');
                fetchOrders(); // Refresh to update state
                if (selectedOrder) {
                    setSelectedOrder({ ...selectedOrder, hasInvoice: true });
                }
            }
        } catch (error) {
            toast.error('Failed to generate invoice');
        } finally {
            setLoading(false);
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
                        <p>Date: ${formatDate(order.createdAt)}</p>
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
        const rows = orders.map(o => `"${o.orderNumber}","${formatDate(o.createdAt)}","${o.user?.name || ''}","${o.user?.email || ''}","${o.user?.phone || ''}",${o.items.length},${o.totalAmount},"${o.status}","${o.paymentMethod}"`).join('\n');
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

    return {
        orders, setOrders,
        stats,
        selectedStatus, setSelectedStatus,
        searchTerm, setSearchTerm,
        dateRange, setDateRange,
        page, setPage,
        limit,
        totalPages,
        totalOrdersCount,
        selectedOrder, setSelectedOrder,
        loading, setLoading,
        selectedOrders, setSelectedOrders,
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
    };
};
