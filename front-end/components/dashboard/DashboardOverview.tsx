import React from 'react';
import {
    TrendingUp, Package, Wrench, ShoppingCart,
    ArrowRight, Activity, BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardOverviewProps {
    stats: any;
    orders: any[];
    repairs: any[];
    promotions: any[];
    isLoading: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
    stats,
    orders,
    repairs,
    promotions,
    isLoading
}) => {
    const navigate = useNavigate();

    // Calculate real stats from data
    const totalOrders = orders.length;
    const activeRepairs = repairs.filter(r => r.status !== 'ready').length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;

    // Calculate spending this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlySpending = orders
        .filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        })
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const statCards = [
        {
            label: 'Total Orders',
            value: totalOrders.toString(),
            change: `${pendingOrders} pending`,
            icon: <Package className="w-6 h-6" />,
            color: 'from-blue-600 to-blue-500',
        },
        {
            label: 'Active Repairs',
            value: activeRepairs.toString(),
            change: `${repairs.length} total`,
            icon: <Wrench className="w-6 h-6" />,
            color: 'from-purple-600 to-purple-500',
        },
        {
            label: 'This Month',
            value: `€${monthlySpending.toFixed(2)}`,
            change: `${orders.filter(o => new Date(o.createdAt).getMonth() === currentMonth).length} orders`,
            icon: <TrendingUp className="w-6 h-6" />,
            color: 'from-emerald-600 to-emerald-500',
        },
        {
            label: 'Completed',
            value: completedOrders.toString(),
            change: `${((completedOrders / Math.max(totalOrders, 1)) * 100).toFixed(0)}% rate`,
            icon: <Activity className="w-6 h-6" />,
            color: 'from-cyan-600 to-cyan-500',
        },
    ];

    const quickActions = [
        {
            label: 'Browse Marketplace',
            icon: <ShoppingCart className="w-5 h-5" />,
            onClick: () => navigate('/marketplace'),
            color: 'from-blue-600 to-purple-600',
        },
        {
            label: 'Request Repair',
            icon: <Wrench className="w-5 h-5" />,
            onClick: () => navigate('/repair'),
            color: 'from-purple-600 to-pink-600',
        },
        {
            label: 'Sell Device',
            icon: <BarChart3 className="w-5 h-5" />,
            onClick: () => navigate('/valuation'),
            color: 'from-emerald-600 to-teal-600',
        },
    ];

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-32 bg-slate-800/50 rounded-2xl"></div>
                <div className="h-32 bg-slate-800/50 rounded-2xl"></div>
                <div className="h-32 bg-slate-800/50 rounded-2xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <div
                        key={idx}
                        className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300 group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{stat.value}</h3>
                        <p className="text-sm text-slate-400 mb-2">{stat.label}</p>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-emerald-400 font-medium">{stat.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={action.onClick}
                            className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-br ${action.color} text-white font-bold hover:scale-105 transition-all duration-300 shadow-lg group`}
                        >
                            <div className="flex items-center gap-3">
                                {action.icon}
                                <span>{action.label}</span>
                            </div>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
                <div className="space-y-4">
                    {orders.slice(0, 3).map((order, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Order #{order._id?.slice(-6)}</p>
                                    <p className="text-sm text-slate-400">{order.items?.length || 0} items</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-bold">€{order.totalAmount?.toFixed(2)}</p>
                                <p className={`text-xs font-medium ${order.status === 'delivered' ? 'text-emerald-400' :
                                    order.status === 'processing' ? 'text-blue-400' :
                                        'text-yellow-400'
                                    }`}>
                                    {order.status}
                                </p>
                            </div>
                        </div>
                    ))}
                    {orders.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No orders yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Promotions */}
            {promotions.length > 0 && (
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                    <h3 className="text-xl font-bold mb-4">Special Offers</h3>
                    <div className="space-y-3">
                        {promotions.slice(0, 2).map((promo: any, idx: number) => (
                            <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <p className="font-bold">{promo.title}</p>
                                <p className="text-sm opacity-90">{promo.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
