import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingCart, DollarSign, TrendingUp, Package, Mail } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, ResponsiveContainer, PieChart, Pie, Cell, Tooltip as PieTooltip, Legend } from 'recharts';
import { api } from '../utils/api';

// const API_URL = 'http://localhost:5000/api'; // use api utility instead

interface Stats {
    totalUsers: number;
    activeUsers: number;
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    totalRevenue: number;
}

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [timelineData, setTimelineData] = useState<any[]>([]);
    const [repairStats, setRepairStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch order stats
            const orderResponse: any = await api.get('/api/orders/admin/stats');
            const orderStats = orderResponse.stats || orderResponse.data?.stats || orderResponse;

            // Fetch user stats
            const userResponse: any = await api.get('/api/users/admin/stats');
            const userStats = userResponse.stats || userResponse.data?.stats || userResponse;

            // Check keys depending on API response structure
            if (orderStats && userStats) {
                setStats({
                    totalUsers: userStats.totalUsers || 0,
                    activeUsers: userStats.activeUsers || 0,
                    totalOrders: orderStats.totalOrders || 0,
                    pendingOrders: orderStats.pendingOrders || 0,
                    deliveredOrders: orderStats.deliveredOrders || 0,
                    totalRevenue: orderStats.totalRevenue || 0
                });
            }

            // Fetch timeline data
            try {
                const timelineRes: any = await api.get('/api/orders/admin/timeline');
                const tData = timelineRes.timeline || timelineRes.data?.timeline || [];
                setTimelineData(tData);
            } catch (err) {
                console.warn('Failed to fetch timeline data', err);
            }

            // Fetch repair stats
            try {
                const repairRes: any = await api.get('/api/repairs/admin/all');
                const tickets = repairRes.tickets || repairRes.data?.tickets || [];
                const statusCounts = tickets.reduce((acc: any, ticket: any) => {
                    const st = ticket.status || 'unknown';
                    acc[st] = (acc[st] || 0) + 1;
                    return acc;
                }, {});
                const pData = Object.keys(statusCounts).map(status => ({
                    name: status,
                    value: statusCounts[status]
                }));
                setRepairStats(pData.length ? pData : [{ name: 'No Data', value: 1 }]);
            } catch (err) {
                console.warn('Failed to fetch repair stats', err);
                setRepairStats([{ name: 'No Data', value: 1 }]);
            }

        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-400">Loading statistics...</div>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.totalUsers || 0,
            icon: Users,
            style: {
                bg: 'bg-blue-500/10',
                text: 'text-blue-400',
                borderTop: 'border-t-blue-500',
                shadow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]'
            },
            subtitle: `${stats?.activeUsers || 0} active`
        },
        {
            title: 'Total Orders',
            value: stats?.totalOrders || 0,
            icon: ShoppingCart,
            style: {
                bg: 'bg-purple-500/10',
                text: 'text-purple-400',
                borderTop: 'border-t-purple-500',
                shadow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]'
            },
            subtitle: `${stats?.pendingOrders || 0} pending`
        },
        {
            title: 'Total Revenue',
            value: `€${(stats?.totalRevenue || 0).toFixed(2)}`,
            icon: DollarSign,
            style: {
                bg: 'bg-emerald-500/10',
                text: 'text-emerald-400',
                borderTop: 'border-t-emerald-500',
                shadow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            },
            subtitle: `${stats?.deliveredOrders || 0} delivered`
        },
        {
            title: 'Delivered Orders',
            value: stats?.deliveredOrders || 0,
            icon: Package,
            style: {
                bg: 'bg-cyan-500/10',
                text: 'text-cyan-400',
                borderTop: 'border-t-cyan-500',
                shadow: 'group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]'
            },
            subtitle: 'Successfully completed'
        }
    ];

    return (
        <div className="p-2 sm:p-6 lg:p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-10 relative z-10">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2">Dashboard Overview</h1>
                <p className="text-slate-400 font-medium tracking-wide">Welcome back to the HandyLand Command Center.</p>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            className={`glass-card border-t-2 ${card.style.borderTop} rounded-2xl p-6 transition-all duration-500 transform hover:-translate-y-2 relative overflow-hidden group ${card.style.shadow}`}
                        >
                            {/* Subtle background glow effect over the card */}
                            <div className={`absolute top-0 right-0 w-32 h-32 ${card.style.bg} blur-[50px] -mr-10 -mt-10 rounded-full opacity-50 transition-opacity duration-300 group-hover:opacity-100`} />
                            
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`p-3.5 ${card.style.bg} rounded-xl shadow-inner`}>
                                        <Icon className={`w-6 h-6 ${card.style.text}`} />
                                    </div>
                                    <TrendingUp className="w-5 h-5 text-emerald-400 opacity-80" />
                                </div>
                                <h3 className="text-slate-400 text-sm font-semibold mb-1 uppercase tracking-wider">{card.title}</h3>
                                <p className="text-4xl font-black text-white mb-2 tracking-tight">{card.value}</p>
                                <p className="text-xs text-slate-500 font-medium">{card.subtitle}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <div className="glass-panel rounded-2xl p-6 lg:p-8 relative overflow-hidden group hover:border-slate-700/80 transition-all duration-500">
                    <h2 className="text-xl font-bold text-white mb-6">Sales Overview (Last 30 Days)</h2>
                    <div className="h-80 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timelineData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} dx={-10} />
                                <LineTooltip
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                                    itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                                    formatter={(value: any) => [`€${Number(value).toFixed(2)}`, 'Revenue']}
                                />
                                <Line type="monotone" dataKey="sales" stroke="#38bdf8" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 8, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl p-6 lg:p-8 relative overflow-hidden group hover:border-slate-700/80 transition-all duration-500">
                    <h2 className="text-xl font-bold text-white mb-6">Repair Tickets by Status</h2>
                    <div className="h-80 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={repairStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={75}
                                    outerRadius={110}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {repairStats.map((_, index) => {
                                        const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                                        return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                                    })}
                                </Pie>
                                <PieTooltip
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '13px', color: '#cbd5e1', paddingTop: '20px' }} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Ultra-Modern Quick Actions */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link
                        to="/users"
                        className="glass-panel p-6 rounded-2xl border border-blue-500/20 hover:bg-blue-900/20 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.15)] flex items-center gap-5"
                    >
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Manage Users</h3>
                            <p className="text-sm text-slate-400 mt-0.5">View and manage accounts</p>
                        </div>
                    </Link>
                    
                    <Link
                        to="/orders"
                        className="glass-panel p-6 rounded-2xl border border-purple-500/20 hover:bg-purple-900/20 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(168,85,247,0.15)] flex items-center gap-5"
                    >
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">View Orders</h3>
                            <p className="text-sm text-slate-400 mt-0.5">Fulfill pending requests</p>
                        </div>
                    </Link>

                    <Link
                        to="/emails"
                        className="glass-panel p-6 rounded-2xl border border-cyan-500/20 hover:bg-cyan-900/20 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(6,182,212,0.15)] flex items-center gap-5"
                    >
                        <div className="w-14 h-14 bg-gradient-to-br from-cyan-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Email Marketing</h3>
                            <p className="text-sm text-slate-400 mt-0.5">Manage automated flows</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
