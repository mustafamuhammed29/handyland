import React from 'react';
import { Package, Copy, Eye, Trash2, CheckSquare, Square, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Order, STATUS_CONFIG } from './types';
import { formatDate, formatTime } from '../../utils/formatDate';

interface OrdersTableProps {
    orders: Order[];
    loading: boolean;
    selectedOrders: string[];
    handleSelectAll: () => void;
    toggleSelectOrder: (id: string) => void;
    setSelectedOrder: (order: Order) => void;
    handleDeleteSingleOrder: (id: string, e: React.MouseEvent) => void;
    copyToClipboard: (text: string, label: string) => void;
    formatPaymentMethod: (method: string) => string;
    // pagination
    page: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    limit: number;
    totalPages: number;
    totalOrdersCount: number;
    setSearchTerm: (s: string) => void;
    setSelectedStatus: (s: string) => void;
    setDateRange: React.Dispatch<React.SetStateAction<{ start: string; end: string }>>;
}

export const OrdersTable = ({
    orders,
    loading,
    selectedOrders,
    handleSelectAll,
    toggleSelectOrder,
    setSelectedOrder,
    handleDeleteSingleOrder,
    copyToClipboard,
    formatPaymentMethod,
    page,
    setPage,
    limit,
    totalPages,
    totalOrdersCount,
    setSearchTerm,
    setSelectedStatus,
    setDateRange,
}: OrdersTableProps) => {
    return (
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
                                        <button onClick={() => { setSearchTerm(''); setSelectedStatus(''); setDateRange({ start: '', end: '' }); }} className="mt-2 text-indigo-400 hover:text-indigo-300 font-medium text-sm">Clear all filters</button>
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
                                            <div className="font-bold text-white">€{(order.totalAmount || 0).toFixed(2)}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{order.items.length} item(s)</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${STATUS_CONFIG[order.status]?.bg || 'bg-slate-800'} ${STATUS_CONFIG[order.status]?.color || 'text-slate-300'} ${STATUS_CONFIG[order.status]?.border || 'border-slate-700'}`}>
                                                {STATUS_CONFIG[order.status]?.icon || <Clock className="w-3 h-3" />}
                                                {STATUS_CONFIG[order.status]?.label || order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                            <div className="font-medium">{formatDate(order.createdAt)}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{formatTime(order.createdAt)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 rounded-lg font-medium text-sm transition-colors border border-indigo-500/20"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteSingleOrder(order._id, e)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg font-medium text-sm transition-colors border border-red-500/20"
                                                    title="Delete Order"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
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
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
    );
};
