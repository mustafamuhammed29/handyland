import React from 'react';
import { Package } from 'lucide-react';

interface Stats {
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
}

export const OrdersStats = ({ stats }: { stats: Stats | null }) => {
    if (!stats) return null;

    return (
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
    );
};
