import React, { useState } from 'react';
import {
    User, Package, Wrench, Settings, LogOut, Activity,
    CreditCard, Bell, Shield, Wallet, ChevronRight,
    BarChart3, Smartphone, FileText, TrendingUp, Plus, MapPin,
    RotateCcw, Truck, MessageSquare, Download, ChevronLeft
} from 'lucide-react';
import { ViewState, User as UserType, RepairTicket, Transaction, SavedValuation } from '../types';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';



const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-slate-800/50 rounded-xl ${className}`} />
);

interface DashboardProps {
    user: UserType | null;
    setView: (view: ViewState) => void;
    logout: () => void;
}

// Mock Data removed - fetching from API

export const Dashboard: React.FC<DashboardProps> = ({ user: initialUser, setView, logout }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'repairs' | 'wallet' | 'settings' | 'valuations'>('overview');
    const [repairs, setRepairs] = useState<RepairTicket[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [valuations, setValuations] = useState<SavedValuation[]>([]);
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
    const [showAddCard, setShowAddCard] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const { addToast } = useToast();

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
            // User Info
            const userData = await api.get<any>('/api/auth/me');
            if (userData.success) setUserStats(userData.user);

            // Orders
            const ordersData = await api.get<any>('/api/orders');
            if (ordersData.success) {
                const formattedOrders: Transaction[] = ordersData.orders.map((order: any) => ({
                    id: order.orderNumber,
                    type: 'purchase',
                    amount: order.totalAmount,
                    date: new Date(order.createdAt).toLocaleDateString(),
                    time: new Date(order.createdAt).toLocaleTimeString(),
                    status: order.status
                }));
                setTransactions(formattedOrders);
            }

            // Repairs
            const repairsData = await api.get<any>('/api/repairs/tickets/my-tickets');
            if (repairsData.success) setRepairs(repairsData.tickets);

            // Valuations
            const valData = await api.get<any>('/api/valuation/saved');
            if (valData.success) setValuations(valData.valuations);

            // Promotions
            const promoData = await api.get<any>('/api/promotions/active');
            if (promoData.success) setPromotions(promoData.promotions);

            // Chart Data
            const statsData = await api.get<any>('/api/stats/user');
            if (statsData.success) setChartData(statsData);

        } catch (error: any) {
            console.error("Error fetching dashboard data", error);
            addToast(error.message || "Failed to refresh dashboard data", "error");
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
        setTimeout(() => setView(ViewState.SELLER_STUDIO), 500);
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
                                    {user.name.charAt(0)}
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

                            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all">
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
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
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Wallet className="w-16 h-16 text-white" />
                                    </div>
                                    <div className="text-slate-500 text-sm mb-1">Balance</div>
                                    <div className="text-3xl font-black text-white">€{user.balance || '0.00'}</div>
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
                                        <button onClick={() => setView(ViewState.REPAIR)} className="bg-white text-blue-600 text-xs font-bold px-4 py-2 rounded-full hover:bg-blue-50 transition-colors shadow-sm">
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

                            {/* Recent Activity */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-white">Recent Activity</h3>
                                    <button onClick={() => setActiveTab('orders')} className="text-xs text-cyan-400 hover:underline">View All Activity</button>
                                </div>
                                <div className="space-y-3">
                                    {transactions.slice(0, 3).map((trx) => (
                                        <div key={trx.id} className="flex items-center justify-between bg-black/20 border border-slate-800/50 p-4 rounded-2xl hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.type === 'purchase' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                    {trx.type === 'purchase' ? <Package className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white capitalize">{trx.type}</div>
                                                    <div className="text-xs text-slate-500">{trx.date} • {trx.id}</div>
                                                </div>
                                            </div>
                                            <div className="font-mono font-bold text-white">
                                                -€{trx.amount}
                                            </div>
                                        </div>
                                    ))}
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
                                <button onClick={() => setView(ViewState.VALUATION)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-slate-700">
                                    <Plus className="w-4 h-4" /> New Scan
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                {valuations.map(val => (
                                    <div key={val.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                                        {/* Background Glow */}
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

                                        {/* Warning if old */}
                                        {/* Mock logic for date comparison */}
                                        <div className="mt-4 pt-4 border-t border-dashed border-slate-800 text-xs text-amber-500 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                            Offer expires in 3 days. Lock in this price today!
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
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-300 mb-4">Quick Actions</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors">
                                                                <MessageSquare className="w-3 h-3" /> Chat with Technician
                                                            </button>
                                                            {ticket.status === 'ready' && (
                                                                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 rounded-lg text-xs font-bold transition-colors">
                                                                    <Truck className="w-3 h-3" /> Schedule Pickup
                                                                </button>
                                                            )}
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
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white">Digital Wallet</h2>
                                <button
                                    onClick={() => setShowAddFunds(true)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Add Funds
                                </button>
                            </div>

                            {/* Cards Container */}
                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                {/* Main Card */}
                                <div className="w-80 h-48 shrink-0 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-6 flex flex-col justify-between relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
                                    <div className="relative z-10 flex justify-between items-start">
                                        <div className="text-slate-400 text-xs uppercase tracking-widest">Balance</div>
                                        <Wallet className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-3xl font-mono text-white mb-1">€{user.balance?.toFixed(2) || '0.00'}</div>
                                        <div className="text-xs text-emerald-400">Available to spend</div>
                                    </div>
                                    <div className="relative z-10 flex justify-between items-end">
                                        <div className="text-slate-400 text-xs">JawwalHub Pay</div>
                                        <div className="text-white font-mono text-sm">•••• 4291</div>
                                    </div>
                                </div>

                                {/* Saved Visa */}
                                <div className="w-80 h-48 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 flex flex-col justify-between shadow-lg relative overflow-hidden transform hover:scale-105 transition-transform cursor-pointer">
                                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-white italic">VISA</span>
                                        <span className="bg-white/20 px-2 py-1 rounded text-[10px] text-white">Default</span>
                                    </div>
                                    <div className="font-mono text-white text-lg tracking-widest mt-4">
                                        •••• •••• •••• 8821
                                    </div>
                                    <div className="flex justify-between text-blue-100 text-xs mt-auto">
                                        <div className="flex flex-col">
                                            <span className="opacity-70">Card Holder</span>
                                            <span className="font-bold">{user.name.toUpperCase()}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="opacity-70">Expires</span>
                                            <span className="font-bold">12/26</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Methods & History */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                                    <h3 className="font-bold text-white mb-4">Payment Methods</h3>
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => setShowAddCard(true)}
                                            className="w-full flex items-center justify-between p-4 rounded-xl border border-dashed border-slate-700 hover:border-blue-500 hover:bg-blue-500/5 transition-all group"
                                        >
                                            <div className="flex items-center gap-3 text-slate-400 group-hover:text-blue-400">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                                    <Plus className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium">Link New Card or Bank Account</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-600" />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                                    <h3 className="font-bold text-white mb-4">Recent Transactions</h3>
                                    <div className="space-y-4">
                                        {transactions.slice(0, 3).map((trx) => (
                                            <div key={trx.id} className="flex items-center justify-between border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${trx.type === 'purchase' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                        {trx.type === 'purchase' ? <Package className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white">{trx.type === 'purchase' ? 'Order Payment' : 'Repair Service'}</div>
                                                        <div className="text-[10px] text-slate-500">{trx.date}</div>
                                                    </div>
                                                </div>
                                                <div className="font-mono font-bold text-white text-sm">-€{trx.amount}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-in fade-in">
                            <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5 text-cyan-400" /> Personal Information
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 uppercase font-bold">Full Name</label>
                                        <input type="text" defaultValue={user.name} className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 uppercase font-bold">Email Address</label>
                                        <input type="email" defaultValue={user.email} className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 uppercase font-bold">Phone Number</label>
                                        <input type="text" defaultValue={user.phone || "+49 152 993 882"} className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 uppercase font-bold">Shipping Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                            <input type="text" defaultValue={user.address || "Alexanderplatz 1, 10178 Berlin"} className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-cyan-500 outline-none transition-colors" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-cyan-900/20 transition-all">
                                        Save Changes
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-purple-400" /> Notification Preferences
                                </h3>
                                <div className="space-y-4">
                                    {['Order Updates', 'Repair Status Changes', 'Promotional Offers', 'New Device Alerts'].map((item) => (
                                        <div key={item} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                                            <span className="text-slate-300 text-sm">{item}</span>
                                            <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer">
                                                <div className="absolute right-1 top-1 w-4 h-4 bg-emerald-400 rounded-full shadow-sm"></div>
                                            </div>
                                        </div>
                                    ))}
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
                                {transactions
                                    .filter(t => t.type === 'purchase')
                                    .filter(t => orderFilter === 'all' || t.status === orderFilter)
                                    .filter(t => t.id.toLowerCase().includes(orderSearch.toLowerCase()))
                                    .slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage)
                                    .map(order => (
                                        <div key={order.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-300">
                                            {/* Card Header (Always Visible) */}
                                            <div
                                                className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/30"
                                                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                            >
                                                <div className="flex items-center gap-4 w-full md:w-auto">
                                                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white flex items-center gap-2">
                                                            {order.id}
                                                            {expandedOrderId === order.id ? <ChevronRight className="w-4 h-4 rotate-90 transition-transform" /> : <ChevronRight className="w-4 h-4 transition-transform" />}
                                                        </div>
                                                        <div className="text-xs text-slate-500">{order.date} • {order.time}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                                    <div className="text-right">
                                                        <div className="font-bold text-white">€{order.amount}</div>
                                                        <div className={`text-xs capitalize font-bold ${order.status === 'delivered' ? 'text-emerald-400' : 'text-yellow-400'}`}>{order.status}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            {expandedOrderId === order.id && (
                                                <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2">
                                                    <div className="h-px bg-slate-800 mb-6"></div>
                                                    <div className="grid md:grid-cols-2 gap-8">
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-300 mb-4">Items</h4>
                                                            {/* Mock Items Logic - In real app, fetch order details */}
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="w-10 h-10 bg-slate-800 rounded-lg"></div>
                                                                <div>
                                                                    <div className="text-sm text-white">iPhone 13 Screen Protector</div>
                                                                    <div className="text-xs text-slate-500">Qty: 1 • €19.99</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-300 mb-4">Actions</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {order.status === 'pending' && (
                                                                    <button className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-500/20">
                                                                        Cancel Order
                                                                    </button>
                                                                )}
                                                                {order.status === 'shipped' && (
                                                                    <button className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold hover:bg-blue-500/20">
                                                                        Track Package
                                                                    </button>
                                                                )}
                                                                {order.status === 'delivered' && (
                                                                    <>
                                                                        <button className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold hover:bg-emerald-500/20">
                                                                            Leave Review
                                                                        </button>
                                                                        <button className="px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-700">
                                                                            Buy Again
                                                                        </button>
                                                                    </>
                                                                )}
                                                                <button className="px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-700 flex items-center gap-2">
                                                                    <Download className="w-3 h-3" /> Invoice
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                {/* Pagination Controls */}
                                {transactions.filter(t => t.type === 'purchase').length > ordersPerPage && (
                                    <div className="flex justify-center gap-2 mt-6">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg bg-slate-800 text-white disabled:opacity-50"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="px-4 flex items-center text-sm font-bold text-white">
                                            Page {currentPage}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(prev => prev + 1)}
                                            disabled={transactions.filter(t => t.type === 'purchase').length <= currentPage * ordersPerPage}
                                            className="p-2 rounded-lg bg-slate-800 text-white disabled:opacity-50"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* Empty State */}
                                {transactions.filter(t => t.type === 'purchase').length === 0 && (
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
                </div>
            </div>
            {/* Modals */}
            {showAddFunds && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setShowAddFunds(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            <Plus className="w-6 h-6 rotate-45" />
                        </button>
                        <h3 className="text-xl font-bold text-white mb-4">Add Funds</h3>
                        <p className="text-slate-400 text-sm mb-6">Top up your JawwalHub wallet instantly.</p>
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {[10, 25, 50, 100, 200, 500].map(amount => (
                                <button key={amount} className="bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-mono font-bold transition-colors">
                                    €{amount}
                                </button>
                            ))}
                        </div>
                        <input type="number" placeholder="Enter custom amount" className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white mb-6 focus:border-cyan-500 outline-none" />
                        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold">
                            Proceed to Payment
                        </button>
                    </div>
                </div>
            )}

            {showAddCard && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setShowAddCard(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            <Plus className="w-6 h-6 rotate-45" />
                        </button>
                        <h3 className="text-xl font-bold text-white mb-4">Add Payment Method</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Card Number</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 pl-10 text-white focus:border-cyan-500 outline-none font-mono" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Expiry</label>
                                    <input type="text" placeholder="MM/YY" className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none font-mono" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase font-bold block mb-1">CVC</label>
                                    <input type="text" placeholder="123" className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Cardholder Name</label>
                                <input type="text" placeholder="John Doe" className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none" />
                            </div>
                            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold mt-4">
                                Save Card
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
