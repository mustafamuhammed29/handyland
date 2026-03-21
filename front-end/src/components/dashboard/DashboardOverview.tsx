import React, { useMemo } from 'react';
import {
    TrendingUp, Package, Wrench, ShoppingCart,
    ArrowRight, Activity, BarChart3, ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface DashboardOverviewProps {
    stats: any;
    orders: any[];
    repairs: any[];
    promotions: any[];
    valuations?: any[];
    isLoading: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
    stats,
    orders,
    repairs,
    promotions,
    valuations = [],
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
            color: 'from-blue-600 to-brand-secondary',
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
            color: 'from-brand-primary to-cyan-500',
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
            icon: <TrendingUp className="w-5 h-5" />,
            onClick: () => navigate('/valuation'),
            color: 'from-emerald-600 to-teal-600',
        },
    ];

    // Prepare chart data for the last 6 months
    const chartData = useMemo(() => {
        const data = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = d.toLocaleDateString('de-DE', { month: 'short' });
            
            // Calculate total spent in this month
            const spent = orders
                .filter((o: any) => {
                    const orderDate = new Date(o.createdAt);
                    return orderDate.getMonth() === d.getMonth() && orderDate.getFullYear() === d.getFullYear();
                })
                .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
                
            data.push({ name: monthName, spent });
        }
        return data;
    }, [orders]);

    if (isLoading) {
        return (
            <div className="space-y-8">
                {/* Skeleton Stats Grid */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 md:p-6 h-36 relative overflow-hidden">
                            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                        </div>
                    ))}
                </div>
                {/* Skeleton Chart */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl h-80 relative overflow-hidden">
                     <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-6">
                {statCards.map((stat, idx) => (
                    <div
                        key={idx}
                        className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-4 md:p-6 hover:border-slate-700 transition-all duration-300 group overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-3 md:mb-4">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform shrink-0`}>
                                {stat.icon}
                            </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1 truncate" title={stat.value}>{stat.value}</h3>
                        <p className="text-[10px] sm:text-xs md:text-sm text-slate-400 mb-1 md:mb-2 truncate">{stat.label}</p>
                        <div className="flex items-center gap-1 md:gap-2 text-[9px] md:text-xs">
                            <span className="text-emerald-400 font-medium truncate">{stat.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-brand-primary" />
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

            {/* Financial Analytics Chart */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 group">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-brand-secondary" />
                            Spending Analytics
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">Your total purchases over the last 6 months</p>
                    </div>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
                                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                formatter={(value: number | undefined) => [`€${Number(value || 0).toFixed(2)}`, 'Spent']}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="spent" 
                                stroke="#06b6d4" 
                                strokeWidth={3}
                                strokeLinecap="round"
                                fillOpacity={1} 
                                fill="url(#colorSpent)" 
                                activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2, className: "animate-pulse" }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Activity — combined orders + repairs + valuations */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-brand-primary" />
                    Letzte Aktivitäten
                </h3>
                <div className="space-y-3">
                    {/* Build unified activity feed */}
                    {(() => {
                        const activities = [
                            ...orders.slice(0, 3).map((o: any) => ({
                                key: `order-${o._id}`,
                                icon: <Package className="w-5 h-5 text-blue-400" />,
                                iconBg: 'bg-blue-600/20',
                                title: `Bestellung #${o._id?.slice(-6)}`,
                                sub: `${o.items?.length || 0} Artikel · €${o.totalAmount?.toFixed(2)}`,
                                badge: o.status,
                                badgeColor: o.status === 'delivered' ? 'text-emerald-400' :
                                    o.status === 'processing' ? 'text-blue-400' : 'text-amber-400',
                                date: o.createdAt
                            })),
                            ...repairs.slice(0, 2).map((r: any) => ({
                                key: `repair-${r.id}`,
                                icon: <Wrench className="w-5 h-5 text-brand-primary" />,
                                iconBg: 'bg-brand-primary/20',
                                title: `Reparatur: ${r.device}`,
                                sub: r.issue || 'Reparaturticket',
                                badge: r.status,
                                badgeColor: r.status === 'ready' ? 'text-emerald-400' :
                                    r.status === 'repairing' ? 'text-blue-400' : 'text-purple-400',
                                date: r.date || r.createdAt
                            })),
                            ...valuations.slice(0, 2).map((v: any) => ({
                                key: `val-${v.id}`,
                                icon: <BarChart3 className="w-5 h-5 text-purple-400" />,
                                iconBg: 'bg-purple-600/20',
                                title: `Angebot: ${v.device}`,
                                sub: `€${v.estimatedValue} · ${v.specs || ''}`,
                                badge: v.status || 'active',
                                badgeColor: v.status === 'paid' ? 'text-emerald-400' :
                                    v.status === 'received' ? 'text-blue-400' : 'text-amber-400',
                                date: v.date
                            }))
                        ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 5);

                        if (activities.length === 0) {
                            return (
                                <div className="text-center py-8 text-slate-500">
                                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p className="font-medium">Noch keine Aktivitäten</p>
                                    <p className="text-sm mt-1">Starte mit deiner ersten Bestellung oder Reparatur</p>
                                    <div className="flex gap-3 justify-center mt-4">
                                        <button onClick={() => navigate('/marketplace')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-bold transition-colors">Marketplace</button>
                                        <button onClick={() => navigate('/repair')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-sm font-bold transition-colors">Reparatur</button>
                                    </div>
                                </div>
                            );
                        }

                        return activities.map(item => (
                            <div key={item.key} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">{item.title}</p>
                                        <p className="text-xs text-slate-400">{item.sub}</p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className={`text-xs font-bold ${item.badgeColor}`}>{item.badge}</p>
                                    <p className="text-[10px] text-slate-600 mt-0.5">
                                        {item.date ? new Date(item.date).toLocaleDateString('de-DE') : ''}
                                    </p>
                                </div>
                            </div>
                        ));
                    })()}
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
