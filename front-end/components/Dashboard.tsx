import React, { useState } from 'react';
import {
    User, Package, Wrench, Settings, LogOut, Activity,
    Wallet, Shield, BarChart3, Heart, ExternalLink, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User as UserType } from '../types';
import { useDashboardData } from '../hooks/useDashboardData';
import { ContactInbox } from './ContactInbox';
import {
    DashboardOverview,
    DashboardOrders,
    DashboardRepairs,
    DashboardWallet,
    DashboardValuations,
    DashboardWishlist,
    DashboardSettings,
} from './dashboard/index';
import { NotificationBell } from './dashboard/NotificationBell';
import { api } from '../utils/api';
import { authService } from '../services/authService';
import { orderService } from '../services/orderService';

interface DashboardProps {
    user: UserType | null;
    logout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user: initialUser, logout }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

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
        wishlist,
        notifications,
        isLoading,
        hasError
    } = dashboardData;

    const unreadCount = notifications.data?.filter((n: any) => !n.read).length || 0;
    const currentUser = user.data || initialUser;
    const isAdmin = currentUser?.role === 'admin';

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
    // Use orderService.downloadInvoice if it supports blob response handling as expected here.
    // orderService.downloadInvoice implementation in step 469 opens window.
    // implementation in Dashboard.tsx creates a blob link.
    // I should check orderService.downloadInvoice implementation again.
    // It does window.open(url, '_blank').
    // The Dashboard implementation downloads it as file.
    // I will stick to existing implementation for now or update orderService to support this.
    // For now I'll leave handleDownloadInvoice as is or update it to use orderService if I update orderService.
    // I'll leave it for now.

    const handleSell = (valId: string) => {
        const val = valuations.data?.find((v: any) => v.id === valId || v._id === valId);
        if (val?.quoteReference) {
            navigate(`/sell/${val.quoteReference}`);
        } else {
            navigate('/valuation');
        }
    };

    const handleDeleteValuation = async (valId: string) => {
        try {
            await api.delete(`/api/valuation/saved/${valId}`);
            await valuations.refetch();
        } catch (error) {
            console.error('Error deleting valuation:', error);
        }
    };

    const handleUpdateProfile = async (data: Partial<UserType>) => {
        try {
            await authService.updateProfile(data);
            user.refetch();
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleUpdatePassword = async (oldPass: string, newPass: string) => {
        try {
            await authService.updatePassword({ oldPassword: oldPass, newPassword: newPass });
        } catch (error) {
            console.error('Error updating password:', error);
        }
    };

    const handleAddAddress = async (address: any) => {
        try {
            await authService.addAddress(address);
            await addresses.refetch();
        } catch (error) {
            console.error('Error adding address:', error);
        }
    };

    const handleUpdateAddress = async (id: string, address: any) => {
        try {
            await authService.updateAddress(id, address);
            await addresses.refetch();
        } catch (error) {
            console.error('Error updating address:', error);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        try {
            await authService.deleteAddress(id);
            await addresses.refetch();
        } catch (error) {
            console.error('Error deleting address:', error);
        }
    };

    const handleAddFunds = () => {
        // Wallet top-up can be done via the admin or a future payment flow.
        // For now, redirect customer to contact us.
        navigate('/contact');
    };

    const handleRemoveWishlistItem = async (itemId: string) => {
        try {
            await api.delete(`/api/wishlist/${itemId}`);
            await wishlist.refetch(); // Instantly update UI after removal
        } catch (error) {
            console.error('Error removing from wishlist:', error);
        }
    };

    if (!currentUser) {
        return null;
    }

    const navItems = [
        { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
        { id: 'orders', label: 'My Orders', icon: <Package className="w-4 h-4" /> },
        { id: 'repairs', label: 'Active Repairs', icon: <Wrench className="w-4 h-4" />, badge: repairs.data?.length || 0 },
        { id: 'valuations', label: 'My Valuations', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'wallet', label: 'Digital Wallet', icon: <Wallet className="w-4 h-4" /> },
        { id: 'wishlist', label: 'Wishlist', icon: <Heart className="w-4 h-4" /> },
        { id: 'messages', label: 'Messages', icon: <Mail className="w-4 h-4" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ];

    const ADMIN_PANEL_URL = 'http://localhost:3001';

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
                                    {(currentUser.name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="text-white font-bold truncate">{currentUser.name}</h3>
                                <div className="flex items-center gap-1 text-xs text-brand-primary">
                                    <Shield className="w-3 h-3" /> {isAdmin ? 'Administrator' : (
                                        currentUser.createdAt
                                            ? `Mitglied seit ${new Date(currentUser.createdAt).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`
                                            : 'Verifiziertes Mitglied'
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="space-y-2">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
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
                                <NotificationBell userId={currentUser?._id} />
                                <button
                                    onClick={() => { logout(); navigate('/'); }}
                                    aria-label="Logout"
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
                    {/* Public Tabs */}
                    {activeTab === 'overview' && (
                        <DashboardOverview
                            stats={stats.data || {}}
                            orders={orders.data || []}
                            repairs={repairs.data || []}
                            promotions={promotions.data || []}
                            valuations={valuations.data || []}
                            isLoading={isLoading}
                        />
                    )}

                    {activeTab === 'orders' && (
                        <DashboardOrders
                            orders={orders.data || []}
                            isLoading={orders.isLoading}
                            onDownloadInvoice={handleDownloadInvoice}
                        />
                    )}

                    {activeTab === 'repairs' && (
                        <DashboardRepairs
                            repairs={repairs.data || []}
                            isLoading={repairs.isLoading}
                        />
                    )}

                    {activeTab === 'valuations' && (
                        <DashboardValuations
                            valuations={valuations.data || []}
                            isLoading={valuations.isLoading}
                            onSell={handleSell}
                            onDelete={handleDeleteValuation}
                        />
                    )}

                    {activeTab === 'wallet' && (
                        <DashboardWallet
                            balance={(wallet.data as any)?.balance || 0}
                            transactions={(wallet.data as any)?.transactions || []}
                            isLoading={wallet.isLoading}
                            onAddFunds={handleAddFunds}
                        />
                    )}

                    {activeTab === 'wishlist' && (
                        <DashboardWishlist
                            wishlistItems={wishlist.data || []}
                            isLoading={wishlist.isLoading}
                            onRemove={handleRemoveWishlistItem}
                        />
                    )}

                    {activeTab === 'settings' && (
                        <DashboardSettings
                            user={currentUser}
                            addresses={addresses.data || []}
                            onUpdateProfile={handleUpdateProfile}
                            onUpdatePassword={handleUpdatePassword}
                            onAddAddress={handleAddAddress}
                            onUpdateAddress={handleUpdateAddress}
                            onDeleteAddress={handleDeleteAddress}
                        />
                    )}

                    {activeTab === 'messages' && <ContactInbox />}

                </div>
            </div>
        </div>
    );
};
