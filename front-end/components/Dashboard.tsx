import React, { useState } from 'react';
import {
    User, Package, Wrench, Settings, LogOut, Activity,
    Wallet, Bell, Shield, BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User as UserType } from '../types';
import { useDashboardData } from '../hooks/useDashboardData';
import {
    DashboardOverview,
    DashboardOrders,
    DashboardRepairs,
    DashboardWallet,
    DashboardValuations,
    DashboardWishlist,
    DashboardSettings
} from './dashboard/index';
import { api } from '../utils/api';

interface DashboardProps {
    user: UserType | null;
    logout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user: initialUser, logout }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'repairs' | 'wallet' | 'settings' | 'valuations' | 'wishlist'>('overview');
    const [showNotifications, setShowNotifications] = useState(false);

    // Use the new data fetching hook
    const dashboardData = useDashboardData();

    const {
        user,
        orders,
        repairs,
        wallet,
        valuations,
        promotions,
        addresses,
        stats,
        notifications,
        isLoading,
        hasError
    } = dashboardData;

    const unreadCount = notifications.data?.filter((n: any) => !n.read).length || 0;

    // Handler functions
    const handleDownloadInvoice = async (orderId: string) => {
        try {
            const response = await api.get(`/api/orders/${orderId}/invoice`, {
                responseType: 'blob'
            } as any);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading invoice:', error);
        }
    };

    const handleSell = (valId: string) => {
        navigate('/marketplace/sell');
    };

    const handleUpdateProfile = async (data: Partial<UserType>) => {
        try {
            await api.put('/api/auth/profile', data);
            user.refetch();
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleUpdatePassword = async (oldPass: string, newPass: string) => {
        try {
            await api.put('/api/auth/password', { oldPassword: oldPass, newPassword: newPass });
        } catch (error) {
            console.error('Error updating password:', error);
        }
    };

    const handleAddAddress = async (address: any) => {
        try {
            await api.post('/api/addresses', address);
            addresses.refetch();
        } catch (error) {
            console.error('Error adding address:', error);
        }
    };

    const handleAddFunds = () => {
        navigate('/wallet/add-funds');
    };

    const handleRemoveWishlistItem = async (itemId: string) => {
        try {
            await api.delete(`/api/wishlist/${itemId}`);
            // Assuming wishlist query exists - if not, this will be handled in future iteration
        } catch (error) {
            console.error('Error removing from wishlist:', error);
        }
    };

    if (!initialUser) {
        return null;
    }

    return (
        <div className="min-h-screen pt-28 pb-12 px-4 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* --- SIDEBAR --- */}
                <div className="w-full lg:w-72 shrink-0">
                    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sticky top-28">
                        {/* Profile Summary */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-900/30">
                                    {(user.data?.name || initialUser.name).charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="text-white font-bold truncate">{user.data?.name || initialUser.name}</h3>
                                <div className="flex items-center gap-1 text-xs text-cyan-400">
                                    <Shield className="w-3 h-3" /> Premium
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="space-y-2">
                            {[
                                { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
                                { id: 'orders', label: 'My Orders', icon: <Package className="w-4 h-4" /> },
                                { id: 'repairs', label: 'Active Repairs', icon: <Wrench className="w-4 h-4" />, badge: repairs.data?.length || 0 },
                                { id: 'valuations', label: 'My Valuations', icon: <BarChart3 className="w-4 h-4" /> },
                                { id: 'wallet', label: 'Digital Wallet', icon: <Wallet className="w-4 h-4" /> },
                                { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as any)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 font-medium ${activeTab === item.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
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

                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className="p-2 text-slate-400 hover:text-white transition-colors relative"
                                    >
                                        <Bell className="w-6 h-6" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-950"></span>
                                        )}
                                    </button>

                                    {/* Notifications Dropdown */}
                                    {showNotifications && (
                                        <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            <div className="p-4 border-b border-slate-800">
                                                <h3 className="font-bold text-white">Notifications</h3>
                                                <p className="text-xs text-slate-400">{unreadCount} unread</p>
                                            </div>
                                            <div className="max-h-96 overflow-y-auto">
                                                {notifications.data && notifications.data.length > 0 ? (
                                                    notifications.data.slice(0, 5).map((notif: any, idx: number) => (
                                                        <div key={idx} className="p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                                            <p className="text-white text-sm font-medium">{notif.title}</p>
                                                            <p className="text-slate-400 text-xs mt-1">{notif.message}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-8 text-center text-slate-500">
                                                        <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm">No notifications</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => { logout(); navigate('/'); }}
                                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </nav>
                    </div>
                </div>

                {/* --- MAIN CONTENT --- */}
                <div className="flex-1 min-w-0">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <DashboardOverview
                            stats={stats.data || {}}
                            orders={orders.data || []}
                            repairs={repairs.data || []}
                            promotions={promotions.data || []}
                            isLoading={isLoading}
                        />
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <DashboardOrders
                            orders={orders.data || []}
                            isLoading={orders.isLoading}
                            onDownloadInvoice={handleDownloadInvoice}
                        />
                    )}

                    {/* Repairs Tab */}
                    {activeTab === 'repairs' && (
                        <DashboardRepairs
                            repairs={repairs.data || []}
                            isLoading={repairs.isLoading}
                        />
                    )}

                    {/* Valuations Tab */}
                    {activeTab === 'valuations' && (
                        <DashboardValuations
                            valuations={valuations.data || []}
                            isLoading={valuations.isLoading}
                            onSell={handleSell}
                        />
                    )}

                    {/* Wallet Tab */}
                    {activeTab === 'wallet' && (
                        <DashboardWallet
                            balance={(wallet.data as any)?.balance || 0}
                            transactions={(wallet.data as any)?.transactions || []}
                            isLoading={wallet.isLoading}
                            onAddFunds={handleAddFunds}
                        />
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <DashboardSettings
                            user={user.data || initialUser}
                            addresses={addresses.data || []}
                            onUpdateProfile={handleUpdateProfile}
                            onUpdatePassword={handleUpdatePassword}
                            onAddAddress={handleAddAddress}
                        />
                    )}

                    {/* Wishlist Tab (if needed) */}
                    {activeTab === 'wishlist' && (
                        <DashboardWishlist
                            wishlistItems={[]}
                            isLoading={false}
                            onRemove={handleRemoveWishlistItem}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
