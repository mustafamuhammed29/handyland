import React, { useState, useCallback } from 'react';
import {
    LayoutDashboard,
    UserCircle, Settings, LogOut, Activity,
    Wallet, Shield, BarChart3, Heart, ExternalLink, Mail, Camera, User, Package, Wrench
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { User as UserType, PhoneListing } from '../types';
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
    NotificationBell,
} from './dashboard/index';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../utils/api';
import { getImageUrl } from '../utils/imageUrl';
import { authService } from '../services/authService';
import { orderService } from '../services/orderService';
import { useTranslation } from 'react-i18next';

interface DashboardProps {
    user: UserType | null;
    logout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user: initialUser, logout }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    // Use the new data fetching hook
    const dashboardData = useDashboardData(activeTab);

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
        settings,
        isLoading,
        hasError
    } = dashboardData;

    const unreadCount = notifications.data?.filter((n: any) => !n.read).length || 0;
    const currentUser = user.data || initialUser;
    const isAdmin = currentUser?.role === 'admin';

    // FIXED: Wrapped all handlers with useCallback (FIX 8)
    const handleDownloadInvoice = useCallback(async (orderId: string) => {
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
    }, []);

    const handleSell = useCallback((valId: string) => {
        const val = valuations.data?.find((v: any) => v.id === valId || v._id === valId);
        if (val?.quoteReference) {
            navigate(`/sell/${val.quoteReference}`);
        } else {
            navigate('/valuation');
        }
    }, [valuations.data, navigate]);

    const handleDeleteValuation = useCallback(async (valId: string) => {
        try {
            await api.delete(`/api/valuation/saved/${valId}`);
            await valuations.refetch();
        } catch (error) {
            console.error('Error deleting valuation:', error);
        }
    }, [valuations]);

    const handleUpdateProfile = useCallback(async (data: Partial<UserType>) => {
        try {
            await authService.updateProfile(data);
            user.refetch();
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    }, [user]);

    const handleUpdatePassword = useCallback(async (oldPass: string, newPass: string) => {
        try {
            await authService.updatePassword({ oldPassword: oldPass, newPassword: newPass });
        } catch (error) {
            console.error('Error updating password:', error);
        }
    }, []);

    const handleAddAddress = useCallback(async (address: any) => {
        try {
            await authService.addAddress(address);
            await addresses.refetch();
        } catch (error) {
            console.error('Error adding address:', error);
        }
    }, [addresses]);

    const handleUpdateAddress = useCallback(async (id: string, address: any) => {
        try {
            await authService.updateAddress(id, address);
            await addresses.refetch();
        } catch (error) {
            console.error('Error updating address:', error);
        }
    }, [addresses]);

    const handleDeleteAddress = useCallback(async (id: string) => {
        try {
            await authService.deleteAddress(id);
            await addresses.refetch();
        } catch (error) {
            console.error('Error deleting address:', error);
        }
    }, [addresses]);

    const handleAddFunds = useCallback(() => {
        navigate('/contact');
    }, [navigate]);

    const handleRemoveWishlistItem = useCallback(async (itemId: string) => {
        try {
            await api.delete(`/api/wishlist/${itemId}`);
            await wishlist.refetch();
        } catch (error) {
            console.error('Error removing from wishlist:', error);
        }
    }, [wishlist]);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast.error('Bitte lade ein gültiges Bild hoch.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('Das Bild darf maximal 5MB groß sein.');
            return;
        }

        setIsUploadingAvatar(true);
        const loadingToast = toast.loading('Profilbild wird hochgeladen...');

        try {
            // 1. Upload to /api/upload
            const formData = new FormData();
            formData.append('image', file);
            
            const uploadRes = await api.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const data = (uploadRes as any)?.data || uploadRes;

            if (data.success && data.imageUrl) {
                // 2. Update user profile
                await api.put('/api/users/profile', { avatar: data.imageUrl });
                await user.refetch();
                toast.success('Profilbild erfolgreich aktualisiert!', { id: loadingToast });
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error('Fehler beim Hochladen des Profilbilds.', { id: loadingToast });
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (!currentUser) {
        return null;
    }

    const navItems = [
        { id: 'overview', label: t('dashboard.overview', 'Overview'), icon: <Activity className="w-4 h-4" /> },
        { id: 'orders', label: t('orders.title', 'My Orders'), icon: <Package className="w-4 h-4" /> },
        { id: 'repairs', label: t('repairs.title', 'Active Repairs'), icon: <Wrench className="w-4 h-4" />, badge: repairs.data?.length || 0 },
        { id: 'valuations', label: t('valuations.title', 'My Valuations'), icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'wallet', label: t('wallet.title', 'Digital Wallet'), icon: <Wallet className="w-4 h-4" /> },
        { id: 'wishlist', label: t('wishlist.title', 'Wishlist'), icon: <Heart className="w-4 h-4" /> },
        { id: 'messages', label: t('messages.title', 'Messages'), icon: <Mail className="w-4 h-4" /> },
        { id: 'settings', label: t('settings.title', 'Settings'), icon: <Settings className="w-4 h-4" /> },
    ];

    const ADMIN_PANEL_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:3001';

    return (
        <div className="min-h-screen pt-28 pb-12 px-4 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* --- SIDEBAR --- */}
                <div className="w-full lg:w-72 shrink-0">
                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-4 lg:p-6 lg:sticky lg:top-28 z-40">
                        {/* Profile Summary & VIP Tier */}
                        <div className="flex flex-col gap-5 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <input 
                                        type="file" 
                                        title="Upload Profile Picture"
                                        aria-label="Upload Profile Picture"
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/jpeg, image/png, image/webp"
                                        onChange={handleAvatarUpload}
                                    />
                                    <div className={`w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-900/30 overflow-hidden relative ${isUploadingAvatar ? 'opacity-50' : ''}`}>
                                        {currentUser.avatar ? (
                                            <img src={getImageUrl(currentUser.avatar)} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            (currentUser.name || '?').charAt(0).toUpperCase()
                                        )}
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Camera className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-slate-900 dark:text-white font-bold break-words leading-tight">{currentUser.name}</h3>
                                    <div className="flex items-center gap-1 text-xs text-brand-primary mt-1">
                                        <Shield className="w-3 h-3" /> {isAdmin ? 'Administrator' : (
                                            currentUser.createdAt
                                                ? `Mitglied seit ${new Date(currentUser.createdAt).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`
                                                : 'Verifiziertes Mitglied'
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Loyalty VIP Tier Logic */}
                            {!isAdmin && (() => {
                                const totalSpent = orders.data?.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0) || 0;
                                
                                // Dynamic VIP Tiers from Admin API
                                const vipTiers = (settings.data?.vipTiers && settings.data.vipTiers.length > 0) ? settings.data.vipTiers : [
                                    { id: 'bronze', name: 'Bronze', color: 'from-[#cd7f32] to-[#8b5a2b]', minSpent: 0, maxSpent: 500 },
                                    { id: 'silver', name: 'Silver', color: 'from-slate-300 to-slate-500', minSpent: 500, maxSpent: 2000 },
                                    { id: 'gold', name: 'Gold', color: 'from-amber-400 to-yellow-600', minSpent: 2000, maxSpent: 5000 },
                                    { id: 'platinum', name: 'Platinum', color: 'from-slate-200 to-slate-400', minSpent: 5000, maxSpent: 10000 },
                                    { id: 'diamond', name: 'Diamond', color: 'from-cyan-300 to-blue-500', minSpent: 10000, maxSpent: 50000 }
                                ];
                                
                                // Sort by minSpent descending to find the highest qualified tier
                                const sortedTiers = [...vipTiers].sort((a, b) => b.minSpent - a.minSpent);
                                const currentTier = sortedTiers.find(t => totalSpent >= t.minSpent) || sortedTiers[sortedTiers.length - 1]; // Fallback to lowest
                                
                                // Determine the next tier
                                const sortedAscending = [...vipTiers].sort((a, b) => a.minSpent - b.minSpent);
                                const nextTierIndex = currentTier ? sortedAscending.findIndex(t => t.id === currentTier.id) + 1 : 1;
                                const nextTier = nextTierIndex < sortedAscending.length ? sortedAscending[nextTierIndex] : null;
                                
                                const maxLimit = nextTier ? nextTier.minSpent : (currentTier?.maxSpent || (currentTier?.minSpent ? currentTier.minSpent * 2 : 500)) || 100000;
                                const nextTierName = nextTier ? nextTier.name : 'Legend';
                                
                                const progress = Math.min((totalSpent / maxLimit) * 100, 100);

                                return (
                                    <div className="bg-slate-800/20 dark:bg-black/20 rounded-2xl p-4 border border-slate-200 dark:border-white/5 relative overflow-hidden group">
                                        <div className={`absolute inset-0 bg-gradient-to-r opacity-5 group-hover:opacity-10 transition-opacity duration-500 mix-blend-overlay ${currentTier?.color || 'from-slate-500 to-slate-700'}`}></div>
                                        <div className="flex justify-between items-end mb-2 relative z-10">
                                            <div>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-0.5">Handyland VIP</p>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentTier.color} shadow-[0_0_8px_currentColor]`}></span>
                                                    <span className={`text-sm font-black text-transparent bg-clip-text bg-gradient-to-r ${currentTier.color}`}>
                                                        {currentTier.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400">Total Spent</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">€{totalSpent.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="relative z-10">
                                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full bg-gradient-to-r ${currentTier.color} relative`}
                                                    style={{ width: `${progress}%` }}
                                                >
                                                    <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 animate-pulse"></div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between mt-1.5">
                                                <span className="text-[9px] font-medium text-slate-500">€{maxLimit - totalSpent > 0 ? (maxLimit - totalSpent).toFixed(2) : 0} to {nextTierName}</span>
                                                <span className="text-[9px] font-bold text-slate-400">€{maxLimit}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Navigation */}
                        <nav className="flex lg:flex-col gap-2 lg:gap-0 lg:space-y-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 custom-scrollbar snap-x">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`shrink-0 snap-start lg:w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 font-medium ${activeTab === item.id
                                        ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                        : 'bg-white/50 dark:bg-slate-800/50 lg:bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {item.icon}
                                        <span className="whitespace-nowrap">{item.label}</span>
                                    </div>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ms-3 lg:ms-0">
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            ))}

                            <div className="hidden lg:block h-px bg-slate-200 dark:bg-slate-800 my-4"></div>
                            
                            {/* Mobile visual separator */}
                            <div className="lg:hidden w-px bg-slate-200 dark:bg-slate-800 my-2 mx-1 shrink-0"></div>

                            {isAdmin && (
                                <a
                                    href={ADMIN_PANEL_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 snap-start lg:w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <ExternalLink className="w-4 h-4" />
                                        <span className="whitespace-nowrap">Admin Panel</span>
                                    </div>
                                </a>
                            )}

                            <div className="flex items-center gap-2 lg:gap-4 shrink-0 px-2 lg:px-0 mt-2">
                                <NotificationBell userId={currentUser?._id} />
                                <button
                                    onClick={() => { logout(); navigate('/'); }}
                                    aria-label="Logout"
                                    className="flex items-center justify-center w-10 h-10 lg:w-auto lg:h-auto rounded-xl bg-white/50 dark:bg-slate-800/50 lg:bg-transparent text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="hidden lg:inline ml-2 font-medium">{t('auth.logout', 'Logout')}</span>
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
                            user={currentUser}
                            userName={currentUser?.name}
                            stats={stats.data}
                            settings={settings.data}
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
                            wishlistItems={(wishlist.data as unknown as PhoneListing[]) || []}
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
