import React from 'react';
import { MapPin, CreditCard, CheckCircle, AlertTriangle, RotateCcw, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Order } from '../../types';
import { formatPrice } from '../../utils/formatPrice';
import { orderService } from '../../services/orderService';

interface OrderSidebarProps {
    order: Order;
    activeRefund: any;
    cancelling: boolean;
    onCancelOrder: () => void;
    onRequestRefund: () => void;
    onCancelRefundRequest: () => void;
}

export const OrderSidebar: React.FC<OrderSidebarProps> = ({ 
    order, 
    activeRefund, 
    cancelling, 
    onCancelOrder, 
    onRequestRefund, 
    onCancelRefundRequest 
}) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                <h2 className="font-bold text-slate-900 dark:text-white mb-4">{t('checkout.orderSummary')}</h2>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>{t('orders.subtotal')}</span>
                        <span>€{(order.totalAmount - (order.tax || 0) - (order.shippingFee || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>{t('orders.shipping')}</span>
                        <span>€{(order.shippingFee || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>{t('orders.tax')}</span>
                        <span>€{(order.tax || 0).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-slate-800 my-2"></div>
                    <div className="flex justify-between text-slate-900 dark:text-white font-bold text-lg">
                        <span>{t('orders.total')}</span>
                        <span>€{order.totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" /> {t('orders.deliveryDetails')}
                </h2>
                {order.shippingAddress ? (
                    <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
                        <div className="text-slate-900 dark:text-white font-medium">{order.shippingAddress.fullName}</div>
                        <div>{order.shippingAddress.street}</div>
                        <div>{order.shippingAddress.zipCode} {order.shippingAddress.city}</div>
                        <div>{order.shippingAddress.country}</div>
                        <div className="pt-2 text-xs">{order.shippingAddress.phone}</div>
                    </div>
                ) : (
                    <div className="text-slate-500 italic">No address details</div>
                )}
            </div>

            {/* Payment Info */}
            <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-yellow-400" /> {t('orders.payment')}
                </h2>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between mb-1">
                        <span>Method</span>
                        <span className="text-slate-900 dark:text-white font-medium">
                            {(() => {
                                switch (order.paymentMethod) {
                                    case 'stripe': return 'Credit Card (Stripe)';
                                    case 'paypal': return 'PayPal';
                                    case 'klarna': return 'Klarna';
                                    case 'giropay': return 'Giropay';
                                    case 'sepa_debit': return 'SEPA Direct Debit';
                                    case 'sofort': return 'Sofort';
                                    case 'cod': return 'Cash on Delivery';
                                    default: return order.paymentMethod ? order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1) : 'Unknown';
                                }
                            })()}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Status</span>
                        <span className={`capitalize font-bold ${order.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                            {order.paymentStatus}
                        </span>
                    </div>
                </div>
            </div>

            {order.hasInvoice && (
                <button
                    onClick={() => orderService.downloadInvoice(order._id)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl transition-colors font-bold text-sm mb-2"
                >
                    {t('orders.downloadInvoice')}
                </button>
            )}
            {order.status === 'pending' && (
                <button
                    onClick={onCancelOrder}
                    disabled={cancelling}
                    className="w-full py-3 border border-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-400 hover:border-red-500/30 rounded-xl transition-colors font-bold text-sm disabled:opacity-50"
                >
                    {t('orders.cancelOrder')}
                </button>
            )}
            {(order.status === 'delivered' || order.status === 'shipped') && !activeRefund && order.paymentStatus !== 'refunded' && (
                <button
                    onClick={onRequestRefund}
                    className="w-full py-3 border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" /> {t('orders.requestRefund', 'Rückgabe / Erstattung anfordern')}
                </button>
            )}
            {activeRefund && activeRefund.status === 'pending' && (
                <div className="space-y-2">
                    <div className="w-full py-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4" /> {t('orders.refundPending', 'Rückgabeanfrage wird geprüft')}
                    </div>
                    <button 
                        onClick={onCancelRefundRequest}
                        className="w-full py-2 text-xs font-bold text-slate-500 hover:text-red-400 transition-colors"
                    >
                        {t('orders.cancelRefundRequest', 'Anfrage stornieren')}
                    </button>
                </div>
            )}
            {activeRefund && activeRefund.status === 'approved' && (
                <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> {t('orders.refundApproved', 'Rückerstattung genehmigt ✅')}
                </div>
            )}
            {activeRefund && activeRefund.status === 'rejected' && (
                <div className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {t('orders.refundRejected', 'Rückgabeanfrage abgelehnt')}
                </div>
            )}
        </div>
    );
};
