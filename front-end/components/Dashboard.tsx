import React, { useState, useEffect } from 'react';
import {
    User, Package, Wrench, Settings, LogOut, Activity,
    CreditCard, Bell, Shield, Wallet, ChevronRight,
    BarChart3, Smartphone, FileText, TrendingUp, Plus, MapPin,
    RotateCcw, Truck, MessageSquare, Download, ChevronLeft, Loader2, Lock, Trash2, Heart, ShoppingCart, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { User as UserType, RepairTicket, Transaction, SavedValuation, Address, PhoneListing, Order, WalletTransaction } from '../types';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import { ENV } from '../src/config/env';

const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-slate-800/50 rounded-xl ${className}`} />
);

interface DashboardProps {
    user: UserType | null;
    logout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user: initialUser, logout }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'repairs' | 'wallet' | 'settings' | 'valuations' | 'wishlist'>('overview');
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [repairs, setRepairs] = useState<RepairTicket[]>([]);
    const [orders, setOrders] = useState<Order[]>([]); // Renamed from transactions
    const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]); // New
    const [valuations, setValuations] = useState<SavedValuation[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [wishlistItems, setWishlistItems] = useState<PhoneListing[]>([]);
    const [userStats, setUserStats] = useState<UserType | null>(initialUser);
    const [promotions, setPromotions] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any>(null);
    const [activeRepairIndex, setActiveRepairIndex] = useState(0);
    // Orders State
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [expandedRepairId, setExpandedRepairId] = useState<string | null>(null);
    const [orderFilter, setOrderFilter] = useState('all');
    const [orderSearch, setOrderSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 5;
    // Wallet State
    const [showAddFunds, setShowAddFunds] = useState(false);
    const [addFundsAmount, setAddFundsAmount] = useState('');
    const [isAddingFunds, setIsAddingFunds] = useState(false);
    const [showAddCard, setShowAddCard] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Address State
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [addressForm, setAddressForm] = useState<Address>({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        isDefault: false
    });
    const [isSavingAddress, setIsSavingAddress] = useState(false);

    // Profile Update State
    const [profileData, setProfileData] = useState({
        name: initialUser?.name || '',
        email: initialUser?.email || '',
        phone: initialUser?.phone || '',
        address: initialUser?.address || ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Refund State
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
    const [refundReason, setRefundReason] = useState("");
    const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

    // Review State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewProductId, setReviewProductId] = useState<string | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const { addToast } = useToast();

    const handleDownloadInvoice = async (orderId: string) => {
        try {
            // Check if we can get the token from localStorage
            const token = localStorage.getItem('token');
            if (!token) throw new Error("No token");

            // Direct fetch to handle blob response properly
            const response = await fetch(`${ENV.API_URL}/api/orders/${orderId}/invoice`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Failed to generate invoice");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${orderId}.html`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            addToast("Invoice downloaded", "success");
        } catch (err) {
            console.error(err);
            addToast("Failed to download invoice", "error");
        }
    };

    const markNotificationRead = async (id: string) => {
        try {
            await api.put(`/api/notifications/${id}/read`, {});
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification read", error);
        }
    };

    const markAllNotificationsRead = async () => {
        try {
            await api.put(`/api/notifications/read-all`, {});
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all read", error);
        }
    };

    const fetchAddresses = async () => {
        try {
            const res = await api.get('/api/addresses');
            setAddresses(res.data.addresses);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchWalletTransactions = async () => {
        try {
            const res = await api.get('/api/transactions');
            setWalletTransactions(res.data.transactions);
        } catch (error) {
            console.error(error);
        }
    };

    // ... handleSaveAddress, handleDeleteAddress, handleAddFunds ...

    const handleSaveAddress = async () => {
        setIsSavingAddress(true);
        try {
            if (editingAddressId) {
                await api.put(`/api/addresses/${editingAddressId}`, addressForm);
                addToast("Address updated", "success");
            } else {
                await api.post('/api/addresses', addressForm);
                addToast("Address added", "success");
            }
            setShowAddressModal(false);
            setEditingAddressId(null);
            setAddressForm({ street: '', city: '', state: '', zipCode: '', country: '', isDefault: false });
            fetchAddresses();
        } catch (error) {
            addToast("Failed to save address", "error");
        } finally {
            setIsSavingAddress(false);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/api/addresses/${id}`);
            addToast("Address removed", "success");
            fetchAddresses();
        } catch (error) {
            addToast("Failed to remove address", "error");
        }
    };

    useEffect(() => {
        if (initialUser) {
            api.get('/api/notifications').then(res => {
                if (res.data.success) {
                    setNotifications(res.data.notifications);
                    setUnreadCount(res.data.notifications.filter((n: any) => !n.read).length);
                }
            }).catch(err => console.error(err));
        }
    }, [initialUser]);

    const handleAddFunds = async () => {
        if (!addFundsAmount || isNaN(parseFloat(addFundsAmount)) || parseFloat(addFundsAmount) <= 0) { // Basic validation
            return addToast("Please enter a valid amount", "error");
        }
        setIsAddingFunds(true);
        try {
            await api.post('/api/transactions/add-funds', {
                amount: parseFloat(addFundsAmount),
                paymentMethod: 'card' // Mock
            });
            addToast("Funds added successfully", "success");
            setShowAddFunds(false);
            setAddFundsAmount('');
            fetchWalletTransactions();
            fetchDashboardData(); // Update balance
        } catch (error) {
            addToast("Failed to add funds", "error");
        } finally {
            setIsAddingFunds(false);
        }
    };

    const handleSubmitRefund = async () => {
        if (!refundReason.trim()) return addToast("Please provide a reason", "error");
        setIsSubmittingRefund(true);
        try {
            await api.post('/api/orders/request-refund', {
                orderId: refundOrderId,
                reason: refundReason,
                items: [], // For now assuming full refund or backend handles it
                images: []
            });
            addToast("Refund requested successfully", "success");
            setShowRefundModal(false);
            setRefundReason("");
            fetchDashboardData();
        } catch (error: any) {
            addToast(error.response?.data?.message || "Failed to request refund", "error");
        } finally {
            setIsSubmittingRefund(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewComment.trim()) return addToast("Please write a comment", "error");
        setIsSubmittingReview(true);
        try {
            await api.post('/api/reviews', {
                productId: reviewProductId,
                rating: reviewRating,
                comment: reviewComment
            });
            addToast("Review submitted successfully", "success");
            setShowReviewModal(false);
            setReviewComment("");
            setReviewRating(5);
        } catch (error: any) {
            addToast(error.response?.data?.message || "Failed to submit review", "error");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Custom Simple Line Chart Component
    const SimpleLineChart = ({ data }: { data: any[] }) => {
        if (!data) return null;
        const maxVal = Math.max(...data.map((d: any) => d.balance));
        const points = data.map((d: any, i: number) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - (d.balance / maxVal) * 100;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className="h-32 w-full mt-4 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <polyline
                        fill="none"
                        className="stroke-cyan-500"
                        strokeWidth="2"
                        points={points}
                        vectorEffect="non-scaling-stroke"
                    />
                    {data.map((d: any, i: number) => (
                        <g key={i}>
                            <circle cx={(i / (data.length - 1)) * 100} cy={100 - (d.balance / maxVal) * 100} r="1.5" className="fill-white stroke-cyan-500" />
                        </g>
                    ))}
                </svg>
                <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-mono">
                    {data.map((d: any) => <span key={d.month}>{d.month}</span>)}
                </div>
            </div>
        );
    };

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const [userRes, ordersRes, repairsRes, valuationsRes, promotionsRes, statsRes, walletRes, addressesRes] = await Promise.all([
                api.get<any>('/api/auth/me'),
                api.get('/api/orders').catch(() => ({ data: { orders: [] } })), // Fallback
                api.get('/api/repairs/my-repairs').catch(() => ({ data: { repairs: [] } })),
                api.get('/api/valuation/my-valuations').catch(() => ({ data: { valuations: [] } })),
                api.get<any>('/api/promotions/active').catch(() => ({ data: { promotions: [] } })),
                api.get<any>('/api/stats/user').catch(() => ({ data: {} })),
                api.get('/api/transactions').catch(() => ({ data: { transactions: [] } })),
                api.get('/api/addresses').catch(() => ({ data: { addresses: [] } })),
            ]);

            if (userRes.data?.success || userRes.success) {
                const user = userRes.data?.user || userRes.user;
                setUserStats(user);
                setProfileData({
                    name: user.name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    address: user.address || ''
                });
            }

            setOrders(ordersRes.data?.orders || []);
            setRepairs(repairsRes.data?.repairs || []);
            setValuations(valuationsRes.data?.valuations || []);
            setPromotions(promotionsRes.data?.promotions || []);
            setChartData(statsRes.data || null);

        } catch (error) {
            console.error("Dashboard Data Fetch Error", error);
            // addToast("Failed to load dashboard data", "error");
        } finally {
            setIsLoading(false);
        }
    };



    // Initial Fetch & Polling
    React.useEffect(() => {
        const init = async () => {
            await fetchDashboardData();
            setIsLoading(false);
        };
        init();
        const interval = setInterval(fetchDashboardData, 30000); // 30s Auto-refresh
        return () => clearInterval(interval);
    }, []);

    const handleProfileUpdate = async () => {
        setIsUpdatingProfile(true);
        try {
            await api.put('/api/users/profile', profileData);
            addToast("Profile updated successfully", "success");
            await fetchDashboardData(); // Refresh data
        } catch (error: any) {
            addToast(error.response?.data?.message || "Failed to update profile", "error");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            addToast("Passwords do not match", "error");
            return;
        }
        setIsUpdatingPassword(true);
        try {
            await api.put('/api/users/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            addToast("Password changed successfully", "success");
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            addToast(error.response?.data?.message || "Failed to change password", "error");
        } finally {
            setIsUpdatingPassword(false);
        }
    };


    const user = userStats || initialUser; // Prefer fetched stats

    if (isLoading && !user) {
        return (
            <div className="min-h-screen pt-28 pb-12 px-4 max-w-7xl mx-auto flex gap-8">
                <Skeleton className="w-full lg:w-72 h-96 shrink-0" />
                <div className="flex-1 space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <div className="grid grid-cols-2 gap-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ready': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
            case 'repairing': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 'diagnosing': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
        }
    };

    const getStatusStep = (status: string) => {
        const steps = ['received', 'diagnosing', 'repairing', 'testing', 'ready'];
        return steps.indexOf(status) + 1;
    };

    const handleSell = (valId: string) => {
        addToast("Redirecting to Seller Studio...", "info");
        setTimeout(() => navigate('/seller'), 500);
    };

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
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="text-white font-bold truncate">{user.name}</h3>
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
                                { id: 'repairs', label: 'Active Repairs', icon: <Wrench className="w-4 h-4" />, badge: repairs.length > 0 ? repairs.length : undefined },
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
                                    {item.badge && (
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
                                            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                                                <h3 className="font-bold text-white text-sm">Notifications</h3>
                                                <button onClick={markAllNotificationsRead} className="text-xs text-blue-400 hover:text-blue-300 font-bold">Mark all read</button>
                                            </div>
                                            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                                {notifications.length > 0 ? (
                                                    notifications.map(n => (
                                                        <div
                                                            key={n._id}
                                                            className={`p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${!n.read ? 'bg-blue-500/5' : ''}`}
                                                            onClick={() => !n.read && markNotificationRead(n._id)}
                                                        >
                                                            <div className="flex gap-3">
                                                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
                                                                <div>
                                                                    <p className={`text-sm ${!n.read ? 'text-white font-medium' : 'text-slate-400'}`}>{n.message}</p>
                                                                    <div className="flex justify-between items-center mt-2">
                                                                        <span className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleDateString()}</span>
                                                                        {n.link && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setShowNotifications(false);
                                                                                    navigate(n.link);
                                                                                }}
                                                                                className="text-xs text-blue-400 hover:underline"
                                                                            >
                                                                                View
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-8 text-center text-slate-500 text-sm">
                                                        No notifications
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all"
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </div>
                        </nav>
                    </div>
                </div>

                {/* --- MAIN CONTENT --- */}
                <div className="flex-1 min-w-0">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <h2 className="text-2xl font-bold text-white mb-2">Command Center</h2>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity rtl:right-auto rtl:left-0">
                                        <Wallet className="w-16 h-16 text-white" />
                                    </div>
                                    <div className="text-slate-500 text-sm mb-1">Balance</div>
                                    <div className="text-3xl font-black text-white">€{user.balance?.toFixed(2) || '0.00'}</div>
                                    <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" /> +12% this month
                                    </div>
                                </div>

                                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
                                    <div className="text-slate-500 text-sm mb-1">Reward Points</div>
                                    <div className="text-3xl font-black text-purple-400">{user.points || '0'}</div>
                                    <div className="text-xs text-slate-400 mt-2">Level 2 Member</div>
                                </div>

                                {promotions.length > 0 ? (
                                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-lg relative overflow-hidden text-white group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <TrendingUp className="w-16 h-16 text-white" />
                                        </div>
                                        <div className="font-bold text-lg mb-1">{promotions[0].title}</div>
                                        <p className="text-xs text-blue-100 opacity-90 mb-4">{promotions[0].description}</p>
                                        <button onClick={() => navigate('/repair')} className="bg-white text-blue-600 text-xs font-bold px-4 py-2 rounded-full hover:bg-blue-50 transition-colors shadow-sm">
                                            Claim {promotions[0].discount} Off
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
                                        <div className="text-slate-500 text-sm mb-1">Active Offers</div>
                                        <div className="text-sm text-slate-400 italic">No active offers at the moment.</div>
                                    </div>
                                )}
                            </div>

                            {/* Active Repair Highlight - Carousel */}
                            {repairs.length > 0 && (
                                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 relative">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-white flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-cyan-400" /> Live Status
                                        </h3>
                                        <button onClick={() => setActiveTab('repairs')} className="text-xs text-cyan-400 hover:underline">View All Repairs</button>
                                    </div>

                                    {/* Carousel Content */}
                                    <div className="relative">
                                        {repairs.length > 1 && (
                                            <div className="absolute top-0 right-0 flex gap-2">
                                                <button
                                                    onClick={() => setActiveRepairIndex(prev => prev > 0 ? prev - 1 : repairs.length - 1)}
                                                    className="p-1 hover:bg-slate-800 rounded-full text-slate-400"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setActiveRepairIndex(prev => prev < repairs.length - 1 ? prev + 1 : 0)}
                                                    className="p-1 hover:bg-slate-800 rounded-full text-slate-400"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-bold text-white">{repairs[activeRepairIndex].device} ({repairs[activeRepairIndex].issue})</span>
                                            <span className="text-xs text-yellow-400 font-mono">{repairs[activeRepairIndex].status.toUpperCase()}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-cyan-400 transition-all duration-1000 relative"
                                                style={{ width: `${(getStatusStep(repairs[activeRepairIndex].status) / 5) * 100}%` }}
                                            >
                                                <div className="absolute right-0 top-0 bottom-0 w-2 bg-white blur-[2px] animate-pulse"></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                                            <span className={getStatusStep(repairs[activeRepairIndex].status) >= 1 ? "text-cyan-400" : ""}>RECEIVED</span>
                                            <span className={getStatusStep(repairs[activeRepairIndex].status) >= 2 ? "text-cyan-400" : ""}>DIAGNOSIS</span>
                                            <span className={getStatusStep(repairs[activeRepairIndex].status) >= 3 ? "text-cyan-400" : ""}>REPAIRING</span>
                                            <span className={getStatusStep(repairs[activeRepairIndex].status) >= 4 ? "text-cyan-400" : ""}>TESTING</span>
                                            <span className={getStatusStep(repairs[activeRepairIndex].status) >= 5 ? "text-cyan-400" : ""}>READY</span>
                                        </div>

                                        {/* Dots Indicator */}
                                        {repairs.length > 1 && (
                                            <div className="flex justify-center gap-1 mt-4">
                                                {repairs.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setActiveRepairIndex(idx)}
                                                        className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === activeRepairIndex ? 'bg-cyan-400' : 'bg-slate-700'}`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Spending & Quick Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Balance Trend Chart */}
                                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                                    <h3 className="font-bold text-white mb-2">Balance Trend</h3>
                                    {chartData ? (
                                        <SimpleLineChart data={chartData.balanceTrend} />
                                    ) : (
                                        <Skeleton className="h-32 w-full mt-4" />
                                    )}
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                                    <h3 className="font-bold text-white mb-4">Quick Actions</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors text-xs text-slate-300 hover:text-white border border-slate-700/50 hover:border-blue-500/30">
                                            <RotateCcw className="w-5 h-5 text-blue-400" />
                                            <span>Repeat Order</span>
                                        </button>
                                        <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors text-xs text-slate-300 hover:text-white border border-slate-700/50 hover:border-purple-500/30">
                                            <Truck className="w-5 h-5 text-purple-400" />
                                            <span>Track Package</span>
                                        </button>
                                        <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors text-xs text-slate-300 hover:text-white border border-slate-700/50 hover:border-emerald-500/30">
                                            <MessageSquare className="w-5 h-5 text-emerald-400" />
                                            <span>Get Help</span>
                                        </button>
                                        <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors text-xs text-slate-300 hover:text-white border border-slate-700/50 hover:border-yellow-500/30">
                                            <Download className="w-5 h-5 text-yellow-400" />
                                            <span>Invoices</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VALUATIONS TAB */}
                    {activeTab === 'valuations' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Saved Valuations</h2>
                                    <p className="text-slate-400 text-sm">Track the value of your devices over time.</p>
                                </div>
                                <button onClick={() => navigate('/valuation')} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-slate-700">
                                    <Plus className="w-4 h-4" /> New Scan
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                {valuations.map(val => (
                                    <div key={val.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/10 transition-colors"></div>

                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-slate-700 shadow-lg relative">
                                                    <Smartphone className="w-7 h-7 text-slate-300" />
                                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-slate-900">
                                                        <Activity className="w-3 h-3 text-white" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-lg">{val.device}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] uppercase font-bold text-slate-400">{val.specs.split('•')[0] || '128GB'}</span>
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] uppercase font-bold text-slate-400">Battery 88%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full uppercase inline-block mb-1">
                                                    {val.condition}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono">{val.date}</div>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-800/50 pt-4 flex items-end justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">Market Value</span>
                                                    <span className="flex items-center text-[10px] text-emerald-400 bg-emerald-500/10 px-1 rounded">
                                                        <TrendingUp className="w-3 h-3 mr-0.5" /> +2%
                                                    </span>
                                                </div>
                                                <div className="text-3xl font-black text-white tracking-tight">€{val.estimatedValue}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                                                    <Shield className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleSell(val.id)}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center gap-2"
                                                >
                                                    Sell Now <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* REPAIRS TAB */}
                    {activeTab === 'repairs' && (
                        <div className="space-y-6 animate-in fade-in">
                            <h2 className="text-2xl font-bold text-white mb-6">Repair Tracking</h2>
                            {repairs.map((ticket) => (
                                <div key={ticket.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden transition-all duration-300">
                                    {/* Main Card Content */}
                                    <div className="p-6">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center relative">
                                                    <Wrench className="w-6 h-6 text-cyan-400" />
                                                    {ticket.status === 'attention' && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                                        {ticket.device}
                                                        <span className="text-xs font-normal text-slate-500 font-mono">#{ticket.id}</span>
                                                    </h3>
                                                    <p className="text-sm text-slate-400">{ticket.issue}</p>
                                                </div>
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div className="relative px-2 mb-8">
                                            <div className="h-1 bg-slate-800 w-full absolute top-1/2 -translate-y-1/2 left-0 right-0 z-0 rounded-full"></div>
                                            <div className="h-1 bg-cyan-500 absolute top-1/2 -translate-y-1/2 left-0 z-0 transition-all duration-1000 rounded-full" style={{ width: `${(getStatusStep(ticket.status) / 5) * 100}%` }}></div>

                                            <div className="relative z-10 flex justify-between">
                                                {['Received', 'Diag', 'Repair', 'Test', 'Ready'].map((step, idx) => {
                                                    const currentStep = idx + 1;
                                                    const active = currentStep <= getStatusStep(ticket.status);
                                                    return (
                                                        <div key={step} className="flex flex-col items-center gap-2">
                                                            <div className={`w-3 h-3 rounded-full border-2 transition-colors ${active ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'bg-slate-900 border-slate-700'}`}></div>
                                                            <span className={`text-[10px] font-bold uppercase ${active ? 'text-cyan-400' : 'text-slate-600'}`}>{step}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="flex justify-between items-center mt-4">
                                            <div className="flex items-center gap-4">
                                                <div className="text-xs text-slate-500">Est. Completion: <span className="text-white font-bold">Today, 6:00 PM</span></div>
                                                <div className="text-xs text-slate-500">Cost: <span className="text-cyan-400 font-bold">€{ticket.cost}</span></div>
                                            </div>
                                            <button
                                                onClick={() => setExpandedRepairId(expandedRepairId === ticket.id ? null : ticket.id)}
                                                className="text-sm text-cyan-400 font-bold hover:text-cyan-300 flex items-center gap-1"
                                            >
                                                {expandedRepairId === ticket.id ? 'Hide Details' : 'View Details'}
                                                <ChevronRight className={`w-4 h-4 transition-transform ${expandedRepairId === ticket.id ? 'rotate-90' : ''}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Section */}
                                    {expandedRepairId === ticket.id && (
                                        <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2">
                                            <div className="h-px bg-slate-800 mb-6"></div>
                                            <div className="grid md:grid-cols-2 gap-8">
                                                {/* Technician Notes */}
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                                                        <MessageSquare className="w-4 h-4" /> Technician Notes
                                                    </h4>
                                                    <div className="bg-black/30 rounded-xl p-4 border border-slate-800/50">
                                                        <p className="text-sm text-slate-400 leading-relaxed">
                                                            Device successfully opened. Found moderate water damage on the logic board near the charging port. Cleaning needed before screen replacement.
                                                        </p>
                                                        <div className="mt-2 text-[10px] text-slate-600 font-mono text-right">Added 2 hours ago by Alex</div>
                                                    </div>
                                                </div>

                                                {/* Actions & Photos */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-300 mb-4">Device Photos</h4>
                                                        <div className="flex gap-2">
                                                            {[1, 2, 3].map(i => (
                                                                <div key={i} className="w-16 h-16 bg-slate-800 rounded-lg border border-slate-700 hover:border-cyan-500 cursor-pointer transition-colors"></div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* WALLET TAB */}
                    {activeTab === 'wallet' && (
                        <div className="space-y-6 animate-in fade-in">
                            <h2 className="text-2xl font-bold text-white mb-6">My Wallet</h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Balance Card */}
                                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Wallet className="w-32 h-32" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-blue-100 mb-2 font-medium">Available Balance</div>
                                        <div className="text-4xl font-bold mb-8">€{userStats?.balance?.toFixed(2) || '0.00'}</div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowAddFunds(true)}
                                                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center gap-2"
                                            >
                                                <Plus className="w-4 h-4" /> Add Funds
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats or Actions */}
                                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col justify-center">
                                    <h3 className="font-bold text-white mb-4">Payment Methods</h3>
                                    <div className="flex items-center gap-4 p-4 bg-black/30 rounded-xl border border-slate-700/50 mb-4">
                                        <div className="w-10 h-6 bg-slate-700 rounded flex items-center justify-center text-[10px] font-bold text-slate-300">CARD</div>
                                        <div className="flex-1 text-sm text-slate-300">•••• •••• •••• 4242</div>
                                        <button className="text-xs text-red-400 font-bold hover:underline">Remove</button>
                                    </div>
                                    <button className="w-full py-3 border border-slate-700 border-dashed rounded-xl text-slate-400 hover:text-white hover:border-slate-500 transition-colors text-sm font-bold flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4" /> Add New Card
                                    </button>
                                </div>
                            </div>

                            {/* Transactions List */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                                <h3 className="font-bold text-white mb-6">Transaction History</h3>
                                <div className="space-y-4">
                                    {walletTransactions.length > 0 ? (
                                        walletTransactions.map((t) => (
                                            <div key={t._id} className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-slate-800">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        t.type === 'withdrawal' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                                                        }`}>
                                                        {t.type === 'deposit' ? <TrendingUp className="w-5 h-5" /> :
                                                            t.type === 'withdrawal' ? <Download className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white capitalize">{t.description || t.type}</div>
                                                        <div className="text-xs text-slate-500">{new Date(t.date || Date.now()).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className={`font-bold ${t.type === 'deposit' ? 'text-emerald-400' : 'text-white'
                                                    }`}>
                                                    {t.type === 'deposit' ? '+' : '-'}€{t.amount.toFixed(2)}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-slate-500">
                                            No transactions yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-in fade-in">
                            <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>

                            {/* Profile Information */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5 text-cyan-400" /> Personal Information
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 uppercase font-bold">Full Name</label>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                            className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 uppercase font-bold">Email Address</label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                            className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 uppercase font-bold">Phone Number</label>
                                        <input
                                            type="text"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 uppercase font-bold">Shipping Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                            <input
                                                type="text"
                                                value={profileData.address}
                                                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                                className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-cyan-500 outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={handleProfileUpdate}
                                        disabled={isUpdatingProfile}
                                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2"
                                    >
                                        {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                    </button>
                                </div>
                            </div>

                            {/* Address Book */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-purple-400" /> Address Book
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setEditingAddressId(null);
                                            setAddressForm({ street: '', city: '', state: '', zipCode: '', country: '', isDefault: false });
                                            setShowAddressModal(true);
                                        }}
                                        className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg hover:bg-purple-500/20 transition-colors font-bold flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add New
                                    </button>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {addresses.map((addr) => (
                                        <div key={addr._id} className="bg-black/30 border border-slate-800 p-4 rounded-xl relative group">
                                            {addr.isDefault && (
                                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-full">
                                                    DEFAULT
                                                </div>
                                            )}
                                            <div className="font-bold text-white mb-1">{addr.street}</div>
                                            <div className="text-sm text-slate-400">{addr.zipCode} {addr.city}</div>
                                            <div className="text-sm text-slate-400 mb-3">{addr.country}</div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingAddressId(addr._id!);
                                                        setAddressForm(addr);
                                                        setShowAddressModal(true);
                                                    }}
                                                    className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAddress(addr._id!)}
                                                    className="text-xs text-red-400 hover:text-red-300 font-bold"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {addresses.length === 0 && (
                                        <div className="col-span-2 text-center py-8 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
                                            No addresses saved
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Password Change */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-red-400" /> Security
                                </h3>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 uppercase font-bold">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 uppercase font-bold">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 uppercase font-bold">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={handlePasswordChange}
                                        disabled={isUpdatingPassword}
                                        className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold border border-slate-700 transition-all flex items-center gap-2"
                                    >
                                        {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ORDERS TAB */}
                    {activeTab === 'orders' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <h2 className="text-2xl font-bold text-white">Order History</h2>
                                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                    <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold border border-slate-700 hover:border-blue-500 transition-all">
                                        <Download className="w-4 h-4" /> Export CSV
                                    </button>
                                </div>
                            </div>

                            {/* Filters & Search */}
                            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by Order ID..."
                                        value={orderSearch}
                                        onChange={(e) => setOrderSearch(e.target.value)}
                                        className="w-full bg-black/50 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white focus:border-cyan-500 outline-none transition-colors"
                                    />
                                </div>
                                <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 custom-scrollbar">
                                    {['all', 'pending', 'shipped', 'delivered', 'cancelled'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setOrderFilter(status)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-colors ${orderFilter === status
                                                ? 'bg-blue-600 text-white shadow-lg'
                                                : 'bg-slate-800 text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Orders List */}
                            <div className="space-y-4">
                                {orders
                                    .filter(t => orderFilter === 'all' || t.status === orderFilter)
                                    .filter(t => t._id?.toLowerCase().includes(orderSearch.toLowerCase()) || t.id?.toLowerCase().includes(orderSearch.toLowerCase()))
                                    .slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage)
                                    .map(order => (
                                        <div key={order._id || order.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-300">
                                            {/* Card Header (Always Visible) */}
                                            <div
                                                className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/30"
                                                onClick={() => setExpandedOrderId(expandedOrderId === (order._id || order.id) ? null : (order._id || order.id))}
                                            >
                                                <div className="flex items-center gap-4 w-full md:w-auto">
                                                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white flex items-center gap-2">
                                                            {order._id || order.id}
                                                            {expandedOrderId === (order._id || order.id) ? <ChevronRight className="w-4 h-4 rotate-90 transition-transform" /> : <ChevronRight className="w-4 h-4 transition-transform" />}
                                                        </div>
                                                        <div className="text-xs text-slate-500">{new Date(order.createdAt || order.date).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                                    <div className="text-right">
                                                        <div className="font-bold text-white">€{order.totalAmount || order.amount}</div>
                                                        <div className={`text-xs capitalize font-bold ${order.status === 'delivered' ? 'text-emerald-400' : 'text-yellow-400'}`}>{order.status}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            {expandedOrderId === (order._id || order.id) && (
                                                <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2">
                                                    <div className="h-px bg-slate-800 mb-6"></div>
                                                    <div className="grid md:grid-cols-2 gap-8">
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-300 mb-4">Items</h4>
                                                            <div className="space-y-3">
                                                                {(order.items || []).map((item: any) => (
                                                                    <div key={item._id || item.name} className="flex items-center gap-3 justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 bg-slate-800 rounded-lg overflow-hidden">
                                                                                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-sm text-white">{item.name}</div>
                                                                                <div className="text-xs text-slate-500">Qty: {item.quantity} • €{item.price}</div>
                                                                            </div>
                                                                        </div>
                                                                        {order.status === 'delivered' && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setReviewProductId(item.product);
                                                                                    setShowReviewModal(true);
                                                                                }}
                                                                                className="text-xs text-yellow-400 hover:text-yellow-300 font-bold border border-yellow-400/30 px-2 py-1 rounded-md hover:bg-yellow-400/10 transition-colors"
                                                                            >
                                                                                Write Review
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-300 mb-4">Actions</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                <button
                                                                    onClick={() => navigate(`/orders/${order._id || order.id}`)}
                                                                    className="w-full mb-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" /> View Full Details
                                                                </button>
                                                                {order.status === 'pending' && (
                                                                    <button className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors">
                                                                        Cancel Order
                                                                    </button>
                                                                )}
                                                                {order.status === 'delivered' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => {
                                                                                setRefundOrderId(order._id || order.id);
                                                                                setShowRefundModal(true);
                                                                            }}
                                                                            className="px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2"
                                                                        >
                                                                            <RotateCcw className="w-3 h-3" /> Return Item
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDownloadInvoice(order._id || order.id)}
                                                                    className="px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2"
                                                                >
                                                                    <Download className="w-3 h-3" /> Invoice
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                {/* Empty State */}
                                {orders.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Package className="w-8 h-8 text-slate-600" />
                                        </div>
                                        <h3 className="text-white font-bold mb-2">No Orders Found</h3>
                                        <p className="text-slate-400 text-sm mb-6">Looks like you haven't placed any orders yet.</p>
                                        <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors">
                                            Start Shopping
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* WISHLIST TAB */}
                    {activeTab === 'wishlist' && (
                        <div className="space-y-6 animate-in fade-in">
                            <h2 className="text-2xl font-bold text-white mb-6">My Wishlist</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {wishlistItems.map((item) => (
                                    <div key={item.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden group hover:border-slate-700 transition-all">
                                        <div className="relative aspect-square bg-slate-800/50">
                                            <img src={item.imageUrl} alt={item.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <button
                                                onClick={() => {
                                                    const newWishlist = wishlistItems.filter(i => i.id !== item.id);
                                                    setWishlistItems(newWishlist);
                                                    localStorage.setItem('wishlist', JSON.stringify(newWishlist));
                                                    addToast("Removed from wishlist", "success");
                                                }}
                                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-white mb-1">{item.model}</h3>
                                            <div className="flex justify-between items-center">
                                                <div className="text-cyan-400 font-bold">€{item.price}</div>
                                                <button
                                                    onClick={() => {
                                                        addToCart({
                                                            id: item.id,
                                                            title: item.model,
                                                            subtitle: item.storage || '',
                                                            price: item.price,
                                                            image: item.imageUrl,
                                                            category: 'device',
                                                            quantity: 1
                                                        });
                                                        addToast("Added to cart", "success");
                                                    }}
                                                    className="text-xs bg-white text-black px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-colors flex items-center gap-1"
                                                >
                                                    <ShoppingCart className="w-3 h-3" /> Buy
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {wishlistItems.length === 0 && (
                                    <div className="col-span-full text-center py-20">
                                        <Heart className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-white mb-2">Your wishlist is empty</h3>
                                        <p className="text-slate-400">Save items you want to buy later</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Modals for Wallet (Add Funds etc) can be kept or enhanced here */}
            {/* Refund Modal */}
            {showRefundModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Request Refund</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Please describe the reason for your return request. Our team will review it shortly.
                        </p>
                        <textarea
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            placeholder="Reason for return (e.g., Damaged item, Wrong item sent)..."
                            className="w-full bg-black/50 border border-slate-700 rounded-xl p-4 text-white focus:border-red-500 outline-none h-32 mb-6 resize-none"
                        ></textarea>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowRefundModal(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitRefund}
                                disabled={isSubmittingRefund}
                                className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-xl font-bold transition-colors flex items-center gap-2"
                            >
                                {isSubmittingRefund ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Write a Review</h3>

                        <div className="flex gap-2 mb-6 justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setReviewRating(star)}
                                    className={`p-2 transition-transform hover:scale-110 ${star <= reviewRating ? 'text-yellow-400' : 'text-slate-600'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill={star <= reviewRating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Share your experience..."
                            className="w-full bg-black/50 border border-slate-700 rounded-xl p-4 text-white focus:border-yellow-500 outline-none h-32 mb-6 resize-none"
                        ></textarea>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowReviewModal(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReview}
                                disabled={isSubmittingReview}
                                className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded-xl font-bold transition-colors flex items-center gap-2"
                            >
                                {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
