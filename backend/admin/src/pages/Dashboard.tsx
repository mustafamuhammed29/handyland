import React, { useState, useEffect } from 'react';
import { Users, ShoppingCart, DollarSign, TrendingUp, Package, Mail } from 'lucide-react';
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
