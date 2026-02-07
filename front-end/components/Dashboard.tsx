import React, { useState } from 'react';
import {
    User, Package, Wrench, Settings, LogOut, Activity,
    CreditCard, Bell, Shield, Wallet, ChevronRight,
    BarChart3, Smartphone, FileText, TrendingUp, Plus, MapPin
} from 'lucide-react';
import { ViewState, User as UserType, RepairTicket, Transaction, SavedValuation } from '../types';
import { useToast } from '../context/ToastContext';

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
    const { addToast } = useToast();

    // Fetch Real Data from Backend
    React.useEffect(() => {
        const fetchDashboardData = async () => {
            // 1. Fetch User Stats (Balance, Points)
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const headers = { 'Authorization': `Bearer ${token}` };

                // User Info
                const userRes = await fetch('http://localhost:5000/api/auth/me', { headers });
                const userData = await userRes.json();
                if (userData.success) setUserStats(userData.user);

                // Orders
                const ordersRes = await fetch('http://localhost:5000/api/orders', { headers });
                const ordersData = await ordersRes.json();
                if (ordersData.success) {
                    // Start of Selection
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
                const repairsRes = await fetch('http://localhost:5000/api/repairs/tickets/my-tickets', { headers });
                const repairsData = await repairsRes.json();
                if (repairsData.success) {
                    setRepairs(repairsData.tickets);
                }

                // Valuations
                const valRes = await fetch('http://localhost:5000/api/valuation/saved', { headers }); // check endpoint path
                const valData = await valRes.json();
                if (valData.success) {
                    setValuations(valData.valuations);
                }

            } catch (error) {
                console.error("Error fetching dashboard data", error);
            }
        };

        fetchDashboardData();
    }, []);

    const user = userStats || initialUser; // Prefer fetched stats

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

                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-lg relative overflow-hidden text-white">
                                    <div className="font-bold text-lg mb-1">Exclusive Offer</div>
                                    <p className="text-xs text-blue-100 opacity-90 mb-4">Get 20% off your next repair screen replacement.</p>
                                    <button onClick={() => setView(ViewState.REPAIR)} className="bg-white text-blue-600 text-xs font-bold px-4 py-2 rounded-full hover:bg-blue-50 transition-colors">
                                        Claim Now
                                    </button>
                                </div>
                            </div>

                            {/* Active Repair Highlight */}
                            {repairs.length > 0 && (
                                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-white flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-cyan-400" /> Live Status
                                        </h3>
                                        <button onClick={() => setActiveTab('repairs')} className="text-xs text-cyan-400 hover:underline">View Details</button>
                                    </div>
                                    <div className="relative">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm font-bold text-white">{repairs[0].device} ({repairs[0].issue})</span>
                                            <span className="text-xs text-yellow-400 font-mono">{repairs[0].status.toUpperCase()}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-400 w-[60%] animate-pulse relative">
                                                <div className="absolute right-0 top-0 bottom-0 w-2 bg-white blur-[2px]"></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                                            <span>RECEIVED</span>
                                            <span>DIAGNOSIS</span>
                                            <span className="text-cyan-400">REPAIRING</span>
                                            <span>TESTING</span>
                                            <span>READY</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recent Activity */}
                            <div>
                                <h3 className="font-bold text-white mb-4">Recent Activity</h3>
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
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Saved Valuations</h2>
                                <button onClick={() => setView(ViewState.VALUATION)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-slate-700">
                                    <Plus className="w-4 h-4" /> New Scan
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                {valuations.map(val => (
                                    <div key={val.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center border border-blue-500/20 text-blue-400">
                                                    <Smartphone className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{val.device}</div>
                                                    <div className="text-xs text-slate-400">{val.specs}</div>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full uppercase">
                                                {val.condition}
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between border-t border-slate-800 pt-4 mt-2">
                                            <div>
                                                <div className="text-[10px] text-slate-500 font-mono">ESTIMATED VALUE</div>
                                                <div className="text-2xl font-black text-white">€{val.estimatedValue}</div>
                                            </div>
                                            <button
                                                onClick={() => handleSell(val.id)}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                                            >
                                                Sell Now
                                            </button>
                                        </div>
                                        <div className="text-[10px] text-slate-600 mt-2 font-mono">Valuation Date: {val.date}</div>
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
                                <div key={ticket.id} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                                                <Smartphone className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg">{ticket.device}</h3>
                                                <p className="text-sm text-slate-400">{ticket.issue}</p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(ticket.status)}`}>
                                            {ticket.status}
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="relative px-2">
                                        <div className="h-1 bg-slate-800 w-full absolute top-1/2 -translate-y-1/2 left-0 right-0 z-0"></div>
                                        <div className="h-1 bg-cyan-500 absolute top-1/2 -translate-y-1/2 left-0 z-0 transition-all duration-1000" style={{ width: `${(getStatusStep(ticket.status) / 5) * 100}%` }}></div>

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

                                    <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
                                        <div className="text-xs text-slate-500">Ticket ID: <span className="text-slate-300 font-mono">{ticket.id}</span></div>
                                        <div className="font-bold text-white">Est. Cost: <span className="text-cyan-400">€{ticket.cost}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* WALLET TAB */}
                    {activeTab === 'wallet' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white">Digital Wallet</h2>
                                <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                                    + Add Funds
                                </button>
                            </div>

                            {/* Cards Container */}
                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                {/* Main Card */}
                                <div className="w-80 h-48 shrink-0 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-6 flex flex-col justify-between relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
                                    <div className="relative z-10 flex justify-between items-start">
                                        <div className="text-slate-400 text-xs uppercase tracking-widest">Balance</div>
                                        <CreditCard className="w-6 h-6 text-white" />
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
                                <div className="w-80 h-48 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 flex flex-col justify-between shadow-lg relative overflow-hidden transform hover:scale-105 transition-transform">
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

                            {/* Transaction History Simple */}
                            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                                <h3 className="font-bold text-white mb-4">Payment Methods</h3>
                                <div className="space-y-4">
                                    <button className="w-full flex items-center justify-between p-4 rounded-xl border border-dashed border-slate-700 hover:border-blue-500 hover:bg-blue-500/5 transition-all group">
                                        <div className="flex items-center gap-3 text-slate-400 group-hover:text-blue-400">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                                <span className="text-lg font-light">+</span>
                                            </div>
                                            <span className="text-sm font-medium">Link New Card or Bank Account</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-600" />
                                    </button>
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
                        <div className="space-y-4 animate-in fade-in">
                            <h2 className="text-2xl font-bold text-white mb-6">Order History</h2>
                            {transactions.filter(t => t.type === 'purchase').map(order => (
                                <div key={order.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                                            <Package className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{order.id}</div>
                                            <div className="text-xs text-slate-500">{order.date}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                        <div className="text-right">
                                            <div className="font-bold text-white">€{order.amount}</div>
                                            <div className="text-xs text-emerald-400 capitalize">{order.status}</div>
                                        </div>
                                        <button className="p-2 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                                            <FileText className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
