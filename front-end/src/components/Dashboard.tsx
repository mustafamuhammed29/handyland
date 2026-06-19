import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    UserCircle, Settings, LogOut, Activity,
    Wallet, Shield, BarChart3, Heart, ExternalLink, Mail, Camera, User, Package, Wrench,
    Zap, Wrench as RepairIcon, BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { User as UserType, PhoneListing } from '../types';
import { useDashboardData } from '../hooks/useDashboardData';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { t, i18n } = useTranslation();
    const { setUser } = useAuth();
    const { setLang } = useLang();
    const [searchParams] = useSearchParams();

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

    // Count unread messages (admin-replied messages that haven't been clicked)
    const unreadMessages = React.useMemo(() => {
        // We track this via sessionStorage to avoid re-fetching
        const seenKey = `seen_msgs_${currentUser?._id}`;
        const seen = sessionStorage.getItem(seenKey);
        return 0; // Will be updated when messages tab loads
    }, [currentUser?._id]);

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
            const res = await authService.updateProfile(data);
            user.refetch();
            
            // Sync AuthContext so navbar and global state updates
            if (res && res.user) {
                setUser({ ...currentUser, ...res.user } as UserType);
            }
            
            // If they just changed language from Profile Config, force global update instantaneously
            if (data.preferredLanguage) {
                setLang(data.preferredLanguage as any);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    }, [user, setUser, setLang]);

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
                await api.put('/api/auth/updateprofile', { avatar: data.imageUrl });
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
        { id: 'overview', label: 'Übersicht', icon: <Activity className="w-4 h-4" /> },
        { id: 'orders', label: 'Meine Bestellungen', icon: <Package className="w-4 h-4" />, badge: orders.data?.filter((o: any) => ['pending','processing'].includes(o.status)).length || 0 },
        { id: 'repairs', label: 'Aktive Reparaturen', icon: <Wrench className="w-4 h-4" />, badge: repairs.data?.filter((r: any) => !['completed','cancelled','ready'].includes(r.status)).length || 0 },
        { id: 'valuations', label: 'Meine Verkäufe', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'wallet', label: 'Digitales Guthaben', icon: <Wallet className="w-4 h-4" /> },
        { id: 'wishlist', label: 'Wunschliste', icon: <Heart className="w-4 h-4" /> },
        { id: 'messages', label: 'Nachrichten', icon: <Mail className="w-4 h-4" />, badge: unreadCount > 0 && activeTab !== 'messages' ? unreadCount : 0 },
        { id: 'settings', label: 'Kontoeinstellungen', icon: <Settings className="w-4 h-4" /> },
    ];
    const ADMIN_PANEL_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';

    // Handle initial tab from URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && navItems.some(item => item.id === tab)) {
            setActiveTab(tab);
        }
    }, [searchParams, navItems]);

    return (
        <div className="min-h-[100dvh] pt-28 pb-12 px-4 max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* --- SIDEBAR --- */}
                <div className="w-full lg:w-80 shrink-0">
                    <div className="bg-slate-950/80 backdrop-blur-xl border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)] rounded-3xl p-4 lg:p-6 lg:sticky lg:top-28 z-40 relative">
                        {/* Background Overlays - constrained to rounded corners */}
                        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                            {/* Sci-Fi Grid Overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px]"></div>
                        </div>

                        {/* Profile Summary & VIP Tier */}
                        <div className="flex flex-col gap-5 mb-8 relative z-10">
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
                                    <div className={`w-16 h-16 bg-slate-900 border-2 border-blue-500/50 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-[0_0_15px_rgba(59,130,246,0.4)] overflow-hidden relative ${isUploadingAvatar ? 'opacity-50' : ''}`}>
                                        {currentUser.avatar ? (
                                            <img src={getImageUrl(currentUser.avatar)} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            (currentUser.name || '?').charAt(0).toUpperCase()
                                        )}
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-blue-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Camera className="w-6 h-6 text-blue-200" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] border-2 border-slate-950 rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[9px] font-mono text-blue-400 mb-0.5 tracking-widest uppercase">ID: {currentUser._id?.substring(0,8) || 'SYSTEM'}</div>
                                    <h3 className="text-white font-bold break-words leading-tight text-base sm:text-lg">{currentUser.name}</h3>
                                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-blue-300/70 mt-1 font-mono">
                                        <Shield className="w-3 h-3" /> {isAdmin ? t('dashboard.adminRole', 'Administrator') : (
                                            currentUser.createdAt
                                                ? t('dashboard.memberSince', 'Mitglied seit {{date}}', { date: new Date(currentUser.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : (i18n.language === 'de' ? 'de-DE' : 'en-US'), { month: '2-digit', year: 'numeric' }) })
                                                : t('dashboard.verifiedMember', 'Verifiziert')
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
                                
                                const sortedTiers = [...vipTiers].sort((a, b) => b.minSpent - a.minSpent);
                                const currentTier = sortedTiers.find(t => totalSpent >= t.minSpent) || sortedTiers[sortedTiers.length - 1];
                                
                                const sortedAscending = [...vipTiers].sort((a, b) => a.minSpent - b.minSpent);
                                const nextTierIndex = currentTier ? sortedAscending.findIndex(t => t.id === currentTier.id) + 1 : 1;
                                const nextTier = nextTierIndex < sortedAscending.length ? sortedAscending[nextTierIndex] : null;
                                
                                const maxLimit = nextTier ? nextTier.minSpent : (currentTier?.maxSpent || (currentTier?.minSpent ? currentTier.minSpent * 2 : 500)) || 100000;
                                const nextTierName = nextTier ? nextTier.name : 'Legend';
                                
                                const progress = Math.min((totalSpent / maxLimit) * 100, 100);

                                return (
                                    <div className="bg-black/40 rounded-2xl p-4 border border-blue-500/10 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                                        <div className="flex justify-between items-end mb-3 relative z-10">
                                            <div>
                                                <p className="text-[9px] text-blue-400/60 uppercase tracking-widest font-bold mb-1">{t('dashboard.spendTier', 'Ausgaben-Level')}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentTier.color} shadow-[0_0_8px_currentColor] animate-pulse`}></span>
                                                    <span className={`text-sm font-black text-transparent bg-clip-text bg-gradient-to-r ${currentTier.color} uppercase tracking-wider`}>
                                                        {currentTier.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-blue-400/60 font-mono tracking-wider">{t('dashboard.totalSpent', 'TOTAL')}</p>
                                                <p className="text-sm font-bold text-white font-mono">€{totalSpent.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="relative z-10">
                                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                                <div 
                                                    className={`h-full bg-gradient-to-r ${currentTier.color} relative`}
                                                    style={{ width: `${progress}%` }}
                                                >
                                                    <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 animate-[scan_2s_linear_infinite]"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <div className="lg:hidden mb-4">
                            <button 
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-blue-900/20 border border-blue-500/30 text-blue-300 hover:text-blue-200 rounded-xl font-bold shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    {navItems.find(i => i.id === activeTab)?.icon}
                                    <span className="uppercase tracking-wider text-xs">
                                        {navItems.find(i => i.id === activeTab)?.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!isMobileMenuOpen && unreadCount > 0 && activeTab !== 'messages' && (
                                        <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold">
                                            {unreadCount}
                                        </span>
                                    )}
                                    <svg className={`w-4 h-4 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>
                        </div>

                        {/* Navigation - Cyber Pill Tabs */}
                        <nav className={`flex-col gap-2 lg:flex pb-1 lg:pb-0 relative z-10 ${isMobileMenuOpen ? 'flex' : 'hidden lg:flex'}`}>
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-3 lg:px-5 lg:py-3 rounded-xl transition-all duration-300 font-bold border text-sm ${activeTab === item.id
                                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                        : 'bg-black/30 lg:bg-transparent border-slate-800/50 lg:border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-blue-200 hover:border-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`${activeTab === item.id ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'text-slate-500'}`}>
                                            {item.icon}
                                        </div>
                                        <span className="whitespace-nowrap uppercase tracking-wider text-xs">{item.label}</span>
                                    </div>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-[0_0_10px_rgba(239,68,68,0.2)] ml-2">
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            ))}

                            <div className="hidden lg:block h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent my-4"></div>
                            
                            {isAdmin && (
                                <a
                                    href={ADMIN_PANEL_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-between px-4 py-3 lg:px-5 lg:py-3 rounded-xl transition-all duration-300 font-bold bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] text-sm uppercase tracking-wider text-xs mt-2 lg:mt-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <ExternalLink className="w-4 h-4" />
                                        <span className="whitespace-nowrap">{t('dashboard.adminPanel', 'Admin Panel')}</span>
                                    </div>
                                </a>
                            )}

                            <div className="flex items-center justify-between lg:justify-start gap-4 mt-4 lg:mt-4 px-2 lg:px-0 pt-4 lg:pt-0 border-t border-slate-800/50 lg:border-t-0">
                                <NotificationBell userId={currentUser?._id} />
                                <button
                                    onClick={() => { logout(); navigate('/'); }}
                                    aria-label="Logout"
                                    className="flex items-center justify-center flex-1 lg:flex-none lg:w-auto lg:h-auto px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all font-bold text-sm uppercase tracking-wider text-xs"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="ml-2">{t('auth.logout', 'Logout')}</span>
                                </button>
                            </div>
                        </nav>

                        {/* Quick Actions Bar */}
                        {!isAdmin && (
                            <div className="mt-6 pt-5 border-t border-slate-800/50">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3 px-1">
                                    {t('dashboard.quickActions', 'Schnellzugriff')}
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    <button
                                        onClick={() => navigate('/marketplace')}
                                        title="Marktplatz"
                                        className="flex flex-col items-center justify-center gap-1.5 h-14 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/50 text-blue-400 transition-all group hover:scale-105 active:scale-95 shadow-[inset_0_0_10px_rgba(59,130,246,0.05)]"
                                    >
                                        <Package className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                        <span className="text-[8px] font-bold uppercase tracking-wider">Shop</span>
                                    </button>
                                    <button
                                        onClick={() => navigate('/repair')}
                                        title="Reparatur buchen"
                                        className="flex flex-col items-center justify-center gap-1.5 h-14 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/50 text-purple-400 transition-all group hover:scale-105 active:scale-95 shadow-[inset_0_0_10px_rgba(168,85,247,0.05)]"
                                    >
                                        <Wrench className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                                        <span className="text-[8px] font-bold uppercase tracking-wider">Repair</span>
                                    </button>
                                    <button
                                        onClick={() => navigate('/valuation')}
                                        title="Gerät verkaufen"
                                        className="flex flex-col items-center justify-center gap-1.5 h-14 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/50 text-emerald-400 transition-all group hover:scale-105 active:scale-95 shadow-[inset_0_0_10px_rgba(16,185,129,0.05)]"
                                    >
                                        <BarChart3 className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                        <span className="text-[8px] font-bold uppercase tracking-wider">Sell</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('wallet')}
                                        title="Wallet aufladen"
                                        className="flex flex-col items-center justify-center gap-1.5 h-14 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/50 text-amber-400 transition-all group hover:scale-105 active:scale-95 shadow-[inset_0_0_10px_rgba(245,158,11,0.05)]"
                                    >
                                        <Wallet className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                                        <span className="text-[8px] font-bold uppercase tracking-wider">Wallet</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('messages')}
                                        title="Support kontaktieren"
                                        className="flex flex-col items-center justify-center gap-1.5 h-14 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/50 text-cyan-400 transition-all group hover:scale-105 active:scale-95 shadow-[inset_0_0_10px_rgba(6,182,212,0.05)] relative"
                                    >
                                        <Mail className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                                        <span className="text-[8px] font-bold uppercase tracking-wider">Support</span>
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] font-black flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('settings')}
                                        title="Einstellungen"
                                        className="flex flex-col items-center justify-center gap-1.5 h-14 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 hover:border-slate-500/50 text-slate-400 transition-all group hover:scale-105 active:scale-95 shadow-[inset_0_0_10px_rgba(148,163,184,0.05)]"
                                    >
                                        <Settings className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_rgba(148,163,184,0.8)]" />
                                        <span className="text-[8px] font-bold uppercase tracking-wider">Settings</span>
                                    </button>
                                </div>
                            </div>
                        )}
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
