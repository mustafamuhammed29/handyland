import React, { useState, useEffect } from 'react';
import {
    User, Package, Wrench, Settings, LogOut, Activity,
    Bell, Shield, Wallet, ChevronRight,
    BarChart3, Smartphone, TrendingUp, Plus, MapPin, Clock
} from 'lucide-react';
import { authService } from '../services/authService';
import { orderService } from '../services/orderService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Order {
    _id: string;
    orderNumber: string;
    items: any[];
    totalAmount: number;
    status: string;
    createdAt: string;
}

interface UserProfile {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: any;
    balance?: number;
    points?: number;
}

export const DashboardConnected: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'profile'>('overview');
    const [user, setUser] = useState<UserProfile | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch user data and orders
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('accessToken');

                if (!token) {
                    setError('Please login to view dashboard');
                    setLoading(false);
                    return;
                }

                // Fetch user profile
                try {
                    const userRes = await authService.getMe();
                    if (userRes.success) {
                        setUser(userRes.user as any); // Type cast if necessary matching UserProfile interface
                    }
                } catch (e) {
                    console.error("Failed to fetch user", e);
                }

                // Fetch orders
                try {
                    const ordersRes = await orderService.getMyOrders();
                    if (ordersRes.success) {
                        setOrders(ordersRes.orders as any[]);
                    }
                } catch (e) {
                    console.error("Failed to fetch orders", e);
                }

            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Error loading dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const logout = async () => {
        try {
            await authService.logout();
        } catch (e) {
            console.error("Logout failed", e);
        }
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        window.location.reload();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'text-emerald-400 bg-emerald-500/10';
            case 'shipped': return 'text-purple-400 bg-purple-500/10';
            case 'processing': return 'text-blue-400 bg-blue-500/10';
            case 'pending': return 'text-yellow-400 bg-yellow-500/10';
            default: return 'text-slate-400 bg-slate-500/10';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center">
                    <div className="text-red-400 text-xl mb-4">{error || 'Not logged in'}</div>
                    <a href="/" className="text-blue-400 hover:underline">Go to Home</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-28 pb-12 px-4 max-w-7xl mx-auto bg-slate-950">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full lg:w-72 shrink-0">
                    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sticky top-28">
                        {/* Profile */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-white font-bold">{user.name}</h3>
                                <div className="text-xs text-cyan-400 flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> Member
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="space-y-2">
                            {[
                                { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
                                { id: 'orders', label: 'My Orders', icon: <Package className="w-4 h-4" />, badge: orders.length },
                                { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as any)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </div>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            ))}

                            <div className="h-px bg-slate-800 my-4"></div>

                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all"
                            >
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white">Welcome back, {user.name}!</h2>

                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl">
                                    <div className="text-slate-500 text-sm mb-1">Total Orders</div>
                                    <div className="text-3xl font-black text-white">{orders.length}</div>
                                    <div className="text-xs text-cyan-400 mt-2 flex items-center gap-1">
                                        <Package className="w-3 h-3" /> All time
                                    </div>
                                </div>

                                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl">
                                    <div className="text-slate-500 text-sm mb-1">Active Orders</div>
                                    <div className="text-3xl font-black text-white">
                                        {orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length}
                                    </div>
                                    <div className="text-xs text-yellow-400 mt-2">In progress</div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white">
                                    <div className="font-bold text-lg mb-1">Need Help?</div>
                                    <p className="text-xs text-blue-100 opacity-90 mb-4">
                                        Contact our support team
                                    </p>
                                    <button className="bg-white text-blue-600 text-xs font-bold px-4 py-2 rounded-full hover:bg-blue-50">
                                        Get Support
                                    </button>
                                </div>
                            </div>

                            {/* Recent Orders */}
                            {orders.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-white mb-4">Recent Orders</h3>
                                    <div className="space-y-3">
                                        {orders.slice(0, 3).map((order) => (
                                            <div
                                                key={order._id}
                                                className="flex items-center justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-2xl"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white">{order.orderNumber}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} item(s)
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono font-bold text-white">€{order.totalAmount.toFixed(2)}</div>
                                                    <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white">Order History</h2>
                                <div className="text-sm text-slate-400">{orders.length} total orders</div>
                            </div>

                            {orders.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <div>No orders yet</div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map((order) => (
                                        <div
                                            key={order._id}
                                            className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl"
                                        >
                                            <div className="flex flex-col md:flex-row justify-between mb-4">
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{order.orderNumber}</h3>
                                                    <div className="text-sm text-slate-400">
                                                        {new Date(order.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-white">€{order.totalAmount.toFixed(2)}</div>
                                                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-slate-800 pt-4">
                                                <div className="text-sm text-slate-400 mb-2">Items ({order.items.length})</div>
                                                <div className="space-y-2">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between text-sm">
                                                            <span className="text-white">{item.name} x{item.quantity}</span>
                                                            <span className="text-slate-400">€{(item.price * item.quantity).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5 text-cyan-400" /> Personal Information
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 uppercase font-bold">Full Name</label>
                                        <input
                                            type="text"
                                            defaultValue={user.name}
                                            aria-label="Full Name"
                                            className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                                            readOnly
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 uppercase font-bold">Email</label>
                                        <input
                                            type="email"
                                            defaultValue={user.email}
                                            aria-label="Email"
                                            className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                                            readOnly
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 uppercase font-bold">Phone</label>
                                        <input
                                            type="text"
                                            defaultValue={user.phone || 'Not set'}
                                            aria-label="Phone"
                                            className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                                            readOnly
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 uppercase font-bold">Member Since</label>
                                        <input
                                            type="text"
                                            defaultValue={new Date(parseInt(user._id.substring(0, 8), 16) * 1000).toLocaleDateString()}
                                            aria-label="Member Since"
                                            className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none"
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardConnected;
