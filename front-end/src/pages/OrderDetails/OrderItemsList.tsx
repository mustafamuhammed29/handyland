import React from 'react';
import { Package, Repeat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Order } from '../../types';
import { formatPrice } from '../../utils/formatPrice';

interface OrderItemsListProps {
    order: Order;
    onBuyAgain: () => void;
}

export const OrderItemsList: React.FC<OrderItemsListProps> = ({ order, onBuyAgain }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 overflow-hidden">
            <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" /> {t('orders.items')}
            </h2>
            <div className="space-y-4">
                {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-3 bg-black/30 rounded-xl border border-slate-800/50">
                        <div className="w-16 h-16 bg-slate-800 rounded-lg shrink-0 overflow-hidden">
                            {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                    <Package className="w-6 h-6" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="text-slate-900 dark:text-white font-medium line-clamp-1">{item.name}</div>
                            <div className="text-xs text-slate-500 mt-1">Qty: {item.quantity} × {formatPrice(item.price)}</div>
                        </div>
                        <div className="text-slate-900 dark:text-white font-bold">
                            {formatPrice(item.quantity * item.price)}
                        </div>
                    </div>
                ))}
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
                <button onClick={onBuyAgain} className="text-sm font-bold text-brand-primary hover:text-brand-primary flex items-center gap-2 transition-colors">
                    <Repeat className="w-4 h-4" /> {t('orders.buyAgain')}
                </button>
            </div>
        </div>
    );
};
