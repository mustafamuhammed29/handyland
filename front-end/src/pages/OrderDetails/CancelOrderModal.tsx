import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { orderService } from '../../services/orderService';
import { useToast } from '../../context/ToastContext';

interface CancelOrderModalProps {
    orderId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({ orderId, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [cancelling, setCancelling] = useState(false);

    const handleCancelOrder = async () => {
        setCancelling(true);
        try {
            const res = await orderService.cancelOrder(orderId);
            if (res.success) {
                addToast(t('orders.cancelSuccess'), 'success');
                onSuccess();
            }
        } catch (err: any) {
            addToast(err.response?.data?.message || t('orders.cancelFailed'), 'error');
            onClose();
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                <div className="flex items-center gap-2 text-amber-400 mb-4">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="text-lg font-bold">{t('orders.cancelOrder')}</h3>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm mb-6">
                    Are you sure you want to cancel this order? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-700 transition-colors font-medium"
                        disabled={cancelling}
                    >
                        {t('orders.keepOrder')}
                    </button>
                    <button
                        onClick={handleCancelOrder}
                        disabled={cancelling}
                        className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 border border-transparent transition-colors font-bold"
                    >
                        {cancelling ? t('orders.cancelling') : t('orders.confirmCancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};
