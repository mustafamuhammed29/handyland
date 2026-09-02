import { Copy, Printer, FileText, Download, CheckCircle, Package, Clock } from 'lucide-react';
import type { Order } from './types';
import { STATUS_CONFIG } from './types';
import { formatDateTime } from '../../utils/formatDate';

interface OrderDetailsModalProps {
    selectedOrder: Order;
    setSelectedOrder: (order: Order | null) => void;
    handlePrintPackingSlip: (order: Order) => void;
    handleDownloadInvoice: (id: string, number: string) => void;
    handleCreateInvoice: (id: string) => void;
    copyToClipboard: (text: string, label: string) => void;
    formatPaymentMethod: (method: string) => string;
    handleApprovePayment: (id: string) => void;
    openStatusModal: (order: Order) => void;
}

export const OrderDetailsModal = ({
    selectedOrder,
    setSelectedOrder,
    handlePrintPackingSlip,
    handleDownloadInvoice,
    handleCreateInvoice,
    copyToClipboard,
    formatPaymentMethod,
    handleApprovePayment,
    openStatusModal
}: OrderDetailsModalProps) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            Order #{selectedOrder.orderNumber}
                            <button title="Copy Order Number" aria-label="Copy Order Number" onClick={() => copyToClipboard(selectedOrder.orderNumber, 'Order Number')} className="text-slate-500 hover:text-white transition-colors"><Copy className="w-4 h-4" /></button>
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">{formatDateTime(selectedOrder.createdAt)}</p>
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
                            onClick={() => {
                                if (selectedOrder.hasInvoice) {
                                    handleDownloadInvoice(selectedOrder._id, selectedOrder.orderNumber);
                                } else {
                                    handleCreateInvoice(selectedOrder._id);
                                }
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-medium text-sm ${
                                selectedOrder.hasInvoice 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20' 
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                        >
                            {selectedOrder.hasInvoice ? <Download className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            {selectedOrder.hasInvoice ? 'Download Invoice' : 'Generate Invoice'}
                        </button>
                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Main Content (Left, 2 columns) */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Order Items */}
                            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-indigo-400" />
                                    Order Items
                                </h3>
                                <div className="space-y-4">
                                    {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
                                            <div className="flex gap-4 items-center">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-slate-700 bg-slate-800" />
                                                ) : (
                                                    <div className="w-16 h-16 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center">
                                                        <Package className="w-8 h-8 text-slate-600" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-white text-base">{item.name}</p>
                                                    <p className="text-sm text-slate-400">Qty: {item.quantity}</p>
                                                    <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider mt-1">{item.productType}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-white text-lg">€{(item.price * item.quantity).toFixed(2)}</p>
                                                {item.quantity > 1 && <p className="text-xs text-slate-500">€{item.price.toFixed(2)} each</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-lg font-bold">
                                    <span className="text-slate-300">Total</span>
                                    <span className="text-white text-2xl bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20">€{selectedOrder.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar (Right, 1 column) */}
                        <div className="space-y-6">
                            {/* Current Status */}
                            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5">
                                <h3 className="text-lg font-bold text-white mb-4">Order Status</h3>
                                <div className="space-y-4">
                                    <div className={`p-4 rounded-xl border ${STATUS_CONFIG[selectedOrder.status]?.bg || 'bg-slate-800'} ${STATUS_CONFIG[selectedOrder.status]?.border || 'border-slate-700'}`}>
                                        <div className={`flex items-center gap-2 mb-2 ${STATUS_CONFIG[selectedOrder.status]?.color || 'text-slate-300'}`}>
                                            {STATUS_CONFIG[selectedOrder.status]?.icon || <Clock className="w-5 h-5" />}
                                            <span className="font-bold text-lg">{STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}</span>
                                        </div>
                                        <p className="text-sm text-slate-400">{STATUS_CONFIG[selectedOrder.status]?.description || 'Status information unavailable.'}</p>
                                    </div>
                                    <button
                                        onClick={() => openStatusModal(selectedOrder)}
                                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors border border-slate-700 text-sm flex items-center justify-center gap-2"
                                    >
                                        Update Status
                                    </button>
                                </div>
                            </div>

                            {/* Customer & Shipping */}
                            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5">
                                <h3 className="text-lg font-bold text-white mb-4">Customer Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Contact</p>
                                        <p className="text-white font-medium">{selectedOrder.user?.name || selectedOrder.shippingAddress?.fullName || 'Guest'}</p>
                                        <p className="text-slate-400 text-sm flex items-center gap-2 group">
                                            {selectedOrder.user?.email || 'No email provided'}
                                            {selectedOrder.user?.email && <button title="Copy Email" aria-label="Copy Email" onClick={() => copyToClipboard(selectedOrder.user.email, 'Email')} className="opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-3 h-3 text-slate-500 hover:text-white" /></button>}
                                        </p>
                                        <p className="text-slate-400 text-sm flex items-center gap-2 group mt-0.5">
                                            {selectedOrder.user?.phone || selectedOrder.shippingAddress?.phone || 'No phone provided'}
                                            {(selectedOrder.user?.phone || selectedOrder.shippingAddress?.phone) && <button title="Copy Phone" aria-label="Copy Phone" onClick={() => copyToClipboard(selectedOrder.user?.phone || selectedOrder.shippingAddress?.phone || '', 'Phone')} className="opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-3 h-3 text-slate-500 hover:text-white" /></button>}
                                        </p>
                                    </div>
                                    <div className="pt-3 border-t border-slate-800">
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center justify-between group">
                                            Shipping Address
                                            <button title="Copy Address" aria-label="Copy Address" onClick={() => copyToClipboard(`${selectedOrder.shippingAddress?.fullName}\n${selectedOrder.shippingAddress?.street}\n${selectedOrder.shippingAddress?.zipCode} ${selectedOrder.shippingAddress?.city}\n${selectedOrder.shippingAddress?.country}`, 'Address')} className="opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-3 h-3 text-slate-500 hover:text-white" /></button>
                                        </p>
                                        <p className="text-slate-300 text-sm leading-relaxed">
                                            {selectedOrder.shippingAddress?.fullName}<br/>
                                            {selectedOrder.shippingAddress?.street}<br/>
                                            {selectedOrder.shippingAddress?.zipCode} {selectedOrder.shippingAddress?.city}<br/>
                                            {selectedOrder.shippingAddress?.country}
                                        </p>
                                    </div>
                                    {selectedOrder.trackingNumber && (
                                        <div className="pt-3 border-t border-slate-800">
                                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 flex justify-between items-center group">
                                                Tracking Number
                                                <button title="Copy Tracking Number" aria-label="Copy Tracking Number" onClick={() => copyToClipboard(selectedOrder.trackingNumber || '', 'Tracking Number')} className="opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-3 h-3 text-slate-500 hover:text-white" /></button>
                                            </p>
                                            <p className="text-indigo-400 font-mono text-sm bg-indigo-500/10 px-3 py-2 rounded-lg border border-indigo-500/20">{selectedOrder.trackingNumber}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5">
                                <h3 className="text-lg font-bold text-white mb-4">Payment</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">Method</span>
                                        <span className="text-sm font-bold text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                                            {formatPaymentMethod(selectedOrder.paymentMethod)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                                        <span className="text-sm text-slate-400">Status</span>
                                        {selectedOrder.paymentStatus === 'paid' ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                PAID
                                            </span>
                                        ) : selectedOrder.paymentStatus === 'awaiting_payment' ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-lg border border-yellow-500/20">
                                                <Clock className="w-3.5 h-3.5" />
                                                AWAITING PAYMENT
                                            </span>
                                        ) : (
                                            <span className="text-sm font-bold text-slate-300 uppercase">{selectedOrder.paymentStatus}</span>
                                        )}
                                    </div>
                                    
                                    {/* Bank Transfer Approval Action */}
                                    {selectedOrder.paymentMethod === 'bank_transfer' && selectedOrder.paymentStatus !== 'paid' && (
                                        <button
                                            onClick={() => handleApprovePayment(selectedOrder._id)}
                                            className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors border border-emerald-500 text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Mark as Paid
                                        </button>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
