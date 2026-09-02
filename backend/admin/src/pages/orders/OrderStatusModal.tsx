import React from 'react';
import { Truck, CheckCircle, Package, AlertTriangle, Send } from 'lucide-react';
import type { Order } from './types';
import { STATUS_CONFIG } from './types';

interface OrderStatusModalProps {
    selectedOrder: Order;
    statusForm: { status: string; trackingNumber: string; adminNote: string };
    setStatusForm: React.Dispatch<React.SetStateAction<{ status: string; trackingNumber: string; adminNote: string }>>;
    setShowStatusModal: (v: boolean) => void;
    handleStatusUpdate: () => void;
    updatingStatus: boolean;
}

export const OrderStatusModal = ({
    selectedOrder,
    statusForm,
    setStatusForm,
    setShowStatusModal,
    handleStatusUpdate,
    updatingStatus
}: OrderStatusModalProps) => {
    const isShipped = statusForm.status === 'shipped';
    const isCancelled = statusForm.status === 'cancelled';

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 bg-slate-800/30">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        Update Order Status
                    </h3>
                    <p className="text-slate-400 text-sm mt-2 font-medium">Order #{selectedOrder.orderNumber}</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Status Selection Grid */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Select New Status</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => {
                                const config = STATUS_CONFIG[status];
                                const isSelected = statusForm.status === status;
                                return (
                                    <button
                                        key={status}
                                        onClick={() => setStatusForm(f => ({ ...f, status }))}
                                        className={`flex flex-col gap-2 p-3 rounded-xl border text-left transition-all ${isSelected
                                                ? `bg-slate-800 ${config.border} shadow-sm ring-1 ring-inset ${config.border.replace('border-', 'ring-')}`
                                                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                                            }`}
                                    >
                                        <div className={`flex items-center gap-2 ${isSelected ? config.color : 'text-slate-400'}`}>
                                            {config.icon}
                                            <span className="font-bold text-sm">{config.label}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tracking Number Input */}
                    {(isShipped || statusForm.trackingNumber) && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label htmlFor="tracking" className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5" /> Tracking Number
                            </label>
                            <div className="relative">
                                <input
                                    id="tracking"
                                    type="text"
                                    value={statusForm.trackingNumber}
                                    onChange={e => setStatusForm(f => ({ ...f, trackingNumber: e.target.value }))}
                                    placeholder="e.g. 1Z9999999999999999"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-sm transition-all"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <Package className="w-4 h-4 text-slate-500" />
                                </div>
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
};
