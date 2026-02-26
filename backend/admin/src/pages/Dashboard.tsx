import React, { useState, useEffect } from 'react';
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

            // Generate mock timeline data for sales
            const tData = [];
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                tData.push({
                    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    sales: Math.floor(Math.random() * 500) + 100
                });
            }
            setTimelineData(tData);

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
            color: 'blue',
            subtitle: `${stats?.activeUsers || 0} active`
        },
        {
            title: 'Total Orders',
            value: stats?.totalOrders || 0,
            icon: ShoppingCart,
            color: 'purple',
            subtitle: `${stats?.pendingOrders || 0} pending`
        },
        {
            title: 'Total Revenue',
            value: `€${(stats?.totalRevenue || 0).toFixed(2)}`,
            icon: DollarSign,
            color: 'green',
            subtitle: `${stats?.deliveredOrders || 0} delivered`
        },
        {
            title: 'Delivered Orders',
            value: stats?.deliveredOrders || 0,
            icon: Package,
            color: 'cyan',
            subtitle: 'Successfully completed'
        }
    ];

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white mb-2">Dashboard</h1>
                <p className="text-slate-400">Welcome to HandyLand Admin Panel</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 bg-${card.color}-600/10 rounded-lg`}>
                                    <Icon className={`w-6 h-6 text-${card.color}-400`} />
                                </div>
                                <TrendingUp className="w-4 h-4 text-green-400" />
                            </div>
                            <h3 className="text-slate-400 text-sm font-medium mb-1">{card.title}</h3>
                            <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
                            <p className="text-xs text-slate-500">{card.subtitle}</p>
                        </div>
                    );
                })}
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Sales Overview (Last 30 Days)</h2>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timelineData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} />
                                <LineTooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                    itemStyle={{ color: '#38bdf8' }}
                                    formatter={(value: any) => [`€${Number(value)}`, 'Sales']}
                                />
                                <Line type="monotone" dataKey="sales" stroke="#38bdf8" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#38bdf8' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Repair Tickets by Status</h2>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={repairStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {repairStats.map((_, index) => {
                                        const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                                        return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                                    })}
                                </Pie>
                                <PieTooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/users"
                        className="p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg hover:bg-blue-600/20 transition-all group"
                    >
                        <Users className="w-8 h-8 text-blue-400 mb-2" />
                        <h3 className="font-bold text-white group-hover:text-blue-400">Manage Users</h3>
                        <p className="text-sm text-slate-400">View and manage all users</p>
                    </a>
                    <a
                        href="/orders"
                        className="p-4 bg-purple-600/10 border border-purple-600/20 rounded-lg hover:bg-purple-600/20 transition-all group"
                    >
                        <ShoppingCart className="w-8 h-8 text-purple-400 mb-2" />
                        <h3 className="font-bold text-white group-hover:text-purple-400">View Orders</h3>
                        <p className="text-sm text-slate-400">Manage all orders</p>
                    </a>
                    <a
                        href="/emails"
                        className="p-4 bg-cyan-600/10 border border-cyan-600/20 rounded-lg hover:bg-cyan-600/20 transition-all group"
                    >
                        <Mail className="w-8 h-8 text-cyan-400 mb-2" />
                        <h3 className="font-bold text-white group-hover:text-cyan-400">Email Templates</h3>
                        <p className="text-sm text-slate-400">Manage email templates</p>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
