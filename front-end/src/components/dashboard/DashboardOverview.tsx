import React, { useMemo, useState, useEffect } from 'react';
import {
    TrendingUp, Package, Wrench, ShoppingCart,
    ArrowRight, Activity, BarChart3, Sun, Moon,
    CloudSun, Leaf, Trophy, Zap, Clock, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';

interface DashboardOverviewProps {
    user?: any;
    userName?: string;
    stats: any;
    settings?: any;
    orders: any[];
    repairs: any[];
    promotions: any[];
    valuations?: any[];
    isLoading: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
    user,
    userName,
    stats,
    settings,
    orders,
    repairs,
    promotions,
    valuations = [],
    isLoading
}) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    
    // Personalization: Dynamic Greeting
    const [greeting, setGreeting] = useState({ text: 'Willkommen', icon: <Sun className="w-6 h-6 text-amber-500" /> });

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting({ text: t('dashboard.greeting.morning', 'Guten Morgen'), icon: <CloudSun className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" /> });
        else if (hour < 18) setGreeting({ text: t('dashboard.greeting.day', 'Guten Tag'), icon: <Sun className="w-6 h-6 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" /> });
        else setGreeting({ text: t('dashboard.greeting.evening', 'Guten Abend'), icon: <Moon className="w-6 h-6 text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.6)]" /> });
    }, [t]);

    // Derived Statistics
    const totalOrders = orders.length;
    const activeRepairs = repairs.filter(r => r.status !== 'ready').length;
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const pendingValuations = valuations.filter(v => ['pending', 'received'].includes(v.status)).length;
    
    // Environmental Gamification (Settings controlled)
    const ecoSettings = settings?.ecoImpact || { enabled: true, co2PerDevice: 79, eWastePerDevice: 0.18 };
    const devicesCount = totalOrders + repairs.length + valuations.length;
    const co2Saved = Math.round(devicesCount * (ecoSettings.co2PerDevice || 79));
    const eWasteSaved = devicesCount * (ecoSettings.eWastePerDevice || 0.18);

    // Spending Analytics
    const chartData = useMemo(() => {
        const data = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = d.toLocaleDateString('de-DE', { month: 'short' });
            const spent = orders
                .filter((o: any) => {
                    const orderDate = new Date(o.createdAt);
                    return orderDate.getMonth() === d.getMonth() && orderDate.getFullYear() === d.getFullYear();
                })
                .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
            data.push({ name: monthName, spent });
        }
        return data;
    }, [orders]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 gap-6">
                <div className="md:col-span-6 xl:col-span-8 h-48 bg-slate-900/40 rounded-3xl animate-pulse"></div>
                <div className="md:col-span-6 xl:col-span-4 h-48 bg-slate-900/40 rounded-3xl animate-pulse"></div>
                <div className="md:col-span-6 xl:col-span-8 h-80 bg-slate-900/40 rounded-3xl animate-pulse"></div>
                <div className="md:col-span-6 xl:col-span-4 h-80 bg-slate-900/40 rounded-3xl animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 gap-6 auto-rows-min">
                
                {/* 1. Hero Welcome Card (Span 8) */}
                <div className="md:col-span-6 xl:col-span-8 relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 sm:p-8 rounded-3xl group shadow-lg hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] transition-all duration-500">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-[80px] group-hover:bg-brand-primary/20 transition-all duration-700 -z-10 translate-x-1/2 -translate-y-1/2"></div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 z-10 relative h-full">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                {greeting.icon}
                                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                    {greeting.text}, {userName?.split(' ')[0] || t('common.member', 'Member')}!
                                </h2>
                            </div>
                            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                                {pendingOrders > 0 || activeRepairs > 0 
                                    ? t('dashboard.hero.statusUpdate', { defaultValue: `Hier ist dein Status-Update: Du hast {{pendingOrders}} aktive Bestellungen und {{activeRepairs}} Geräte in Reparatur.`, pendingOrders, activeRepairs })
                                    : t('dashboard.hero.allClear', 'Alles ist auf dem neuesten Stand. Entdecke unsere neuesten Angebote im Marktplatz oder nutze unsere Reparatur-Services.')}
                            </p>
                            
                            <div className="flex flex-wrap gap-3 mt-6">
                                <button onClick={() => navigate('/marketplace')} className="px-5 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                    {t('dashboard.hero.marketplace', 'Marktplatz')}
                                </button>
                                <button onClick={() => navigate('/repair')} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 border border-white/5 transition-all">
                                    {t('dashboard.hero.newRepair', 'Neuer Reparaturauftrag')}
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex gap-4 sm:flex-col sm:w-auto w-full">
                            <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex-1 sm:w-48 backdrop-blur-md">
                                <div className="flex items-center gap-2 text-brand-primary mb-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-bold font-mono">{t('dashboard.hero.active', 'AKTIV')}</span>
                                </div>
                                <p className="text-2xl font-black text-white">{pendingOrders + activeRepairs + pendingValuations}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{t('dashboard.hero.ongoing', 'Laufende Vorgänge')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Stunning Loyalty & Rewards Card (Span 4) */}
                {settings?.features?.loyalty?.enabled !== false && (
                    <div className="md:col-span-6 xl:col-span-4 relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl group shadow-[0_0_30px_rgba(79,70,229,0.15)] hover:shadow-[0_0_40px_rgba(79,70,229,0.3)] transition-all duration-500">
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50"></div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-primary/20 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                        
                        <div className="z-10 relative h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-white/70 text-[10px] font-bold tracking-widest uppercase mb-1">{t('dashboard.rewards.title', 'HandyLand Rewards')}</p>
                                    <h3 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                                        {user?.membershipLevel === 4 ? t('dashboard.rewards.tier.platinum', 'Platinum') : user?.membershipLevel === 3 ? t('dashboard.rewards.tier.gold', 'Gold') : user?.membershipLevel === 2 ? t('dashboard.rewards.tier.silver', 'Silver') : t('dashboard.rewards.tier.member', 'Member')}
                                    </h3>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-4xl sm:text-5xl font-black text-white drop-shadow-md tracking-tighter">{user?.loyaltyPoints || 0} <span className="text-sm font-bold text-white/50 tracking-normal">{t('dashboard.rewards.pts', 'PTS')}</span></span>
                                </div>
                                
                                <div className="w-full bg-black/40 rounded-full h-2.5 mb-2 overflow-hidden border border-white/5 relative">
                                    <div className="absolute inset-0 bg-white/5"></div>
                                    {user?.membershipLevel === 4 ? (
                                        <div className="bg-gradient-to-r from-brand-primary to-purple-500 h-full rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ width: '100%' }}></div>
                                    ) : (
                                        <div className="bg-gradient-to-r from-brand-primary to-purple-500 h-full rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ width: `${Math.min(((user?.loyaltyPoints || 0) % 2000) / 2000 * 100, 100)}%` }}></div>
                                    )}
                                </div>
                                <p className="text-[11px] text-white/50 font-medium">
                                    {user?.membershipLevel === 4 ? t('dashboard.rewards.maxTier', 'Max Tier Reached!') : t('dashboard.rewards.nextTier', { defaultValue: '{{pts}} pts to next tier update', pts: 2000 - ((user?.loyaltyPoints || 0) % 2000) })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Helper logic for active tracking */}
                {(() => {
                    const activeRepair = repairs.find(r => !['ready', 'completed', 'cancelled'].includes(r.status));
                    const activeOrder = orders.find(o => !['delivered', 'completed', 'cancelled'].includes(o.status));
                    const activeValएशन = valuations.find(v => !['completed', 'cancelled', 'rejected', 'paid'].includes(v.status));
                    
                    const activeItem = activeRepair ? { type: 'repair', data: activeRepair } 
                                     : activeOrder ? { type: 'order', data: activeOrder }
                                     : activeValएशन ? { type: 'valuation', data: activeValएशन } 
                                     : null;

                    if (!activeItem) return null;

                    let steps: { label: string; id: string }[] = [];
                    let currentStepIndex = 0;
                    let title = '';
                    let icon = null;

                    if (activeItem.type === 'order') {
                        steps = [
                            { label: 'Bestellt', id: 'pending' },
                            { label: 'In Bearbeitung', id: 'processing' },
                            { label: 'Versandt', id: 'shipped' },
                            { label: 'Zugestellt', id: 'delivered' }
                        ];
                        const orderStatuses = ['pending', 'processing', 'shipped', 'delivered'];
                        title = `Bestellung #${activeItem.data._id?.slice(-5) || activeItem.data.id?.slice(-5)}`;
                        currentStepIndex = orderStatuses.indexOf(activeItem.data.status);
                        icon = <Package className="w-6 h-6 text-blue-400" />;
                    } else if (activeItem.type === 'repair') {
                         steps = [
                            { label: 'Erhalten', id: 'received' },
                            { label: 'Diagnose', id: 'diagnosing' },
                            { label: 'Reparatur', id: 'repairing' },
                            { label: 'Fertig', id: 'ready' }
                        ];
                        const repairStatuses = ['received', 'diagnosing', 'repairing', 'ready'];
                        // Might use typical statuses, map them roughly
                        const s = activeItem.data.status.toLowerCase();
                        currentStepIndex = s === 'pending' || s === 'received' ? 0 : s === 'diagnosing' ? 1 : s === 'repairing' ? 2 : 3;
                        title = `Reparatur: ${activeItem.data.device || activeItem.data.deviceModel || 'Gerät'}`;
                        icon = <Wrench className="w-6 h-6 text-purple-400" />;
                    } else if (activeItem.type === 'valuation') {
                         steps = [
                            { label: 'Anfrage', id: 'pending' },
                            { label: 'Erhalten', id: 'received' },
                            { label: 'Prüfung', id: 'evaluating' },
                            { label: 'Angebot', id: 'offer_made' }
                        ];
                        const valStatuses = ['pending', 'received', 'evaluating', 'offer_made'];
                        const s = activeItem.data.status.toLowerCase();
                        currentStepIndex = valStatuses.indexOf(s) > -1 ? valStatuses.indexOf(s) : 0;
                        title = `Verkauf: ${activeItem.data.device || activeItem.data.deviceModel || 'Gerät'}`;
                        icon = <ShieldCheck className="w-6 h-6 text-emerald-400" />;
                    }

                    if (currentStepIndex === -1) currentStepIndex = 0; // fallback

                    return (
                        <div className="md:col-span-6 xl:col-span-12 bg-slate-900/60 backdrop-blur-xl border border-brand-primary/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
                            
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-md">
                                    {icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                                    <p className="text-brand-primary text-sm font-bold flex items-center gap-2 mt-1">
                                        <Activity className="w-4 h-4 animate-pulse" /> {t('dashboard.tracking.live', 'LIVE TRACKING')}
                                    </p>
                                </div>
                            </div>

                            {/* Stepper */}
                            <div className="relative flex justify-between items-center max-w-4xl mx-auto mt-10 mb-4 px-4 sm:px-10">
                                {/* Base Progress Line */}
                                <div className="absolute top-4 left-10 right-10 h-1.5 bg-slate-800 rounded-full"></div>
                                {/* Active Progress Line */}
                                <div 
                                    className="absolute top-4 left-10 h-1.5 bg-brand-primary shadow-[0_0_15px_rgba(6,182,212,0.5)] rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - 40px)` }}
                                ></div>

                                {steps.map((step, idx) => {
                                    const isCompleted = idx < currentStepIndex;
                                    const isActive = idx === currentStepIndex;
                                    const isPending = idx > currentStepIndex;

                                    return (
                                        <div key={step.id} className="relative flex flex-col items-center group">
                                            {/* Step Circle */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 relative z-10 transition-all duration-500
                                                ${isCompleted ? 'bg-brand-primary border-brand-primary text-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 
                                                  isActive ? 'bg-slate-900 border-brand-primary border-dashed animate-[spin_4s_linear_infinite] shadow-[0_0_20px_rgba(6,182,212,0.6)]' : 
                                                  'bg-slate-900 border-slate-700 text-slate-500'}`}
                                            >
                                                {/* Inner indicator for active state to not spin the icon */}
                                                <div className={`w-full h-full rounded-full flex items-center justify-center absolute top-0 left-0 ${isActive && 'animate-[spin_4s_linear_infinite_reverse]'}`}>
                                                     {isCompleted ? <ShieldCheck className="w-5 h-5" /> : 
                                                      <span className={`text-sm font-bold ${isActive ? 'text-brand-primary drop-shadow-[0_0_5px_rgba(6,182,212,1)]' : 'text-slate-500'}`}>{idx + 1}</span>}
                                                </div>
                                            </div>
                                            
                                            {/* Label */}
                                            <span className={`absolute top-14 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors duration-300
                                                ${isCompleted || isActive ? 'text-white drop-shadow-md' : 'text-slate-500'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* 2. Gamification / Environmental Impact (Span 4) */}
                {ecoSettings.enabled !== false && (
                    <div className="md:col-span-6 xl:col-span-4 relative overflow-hidden bg-gradient-to-br from-[#064e3b]/80 to-[#022c22]/80 backdrop-blur-xl border border-emerald-500/20 p-6 sm:p-8 rounded-3xl group shadow-lg hover:shadow-[0_8px_32px_0_rgba(16,185,129,0.2)] transition-all duration-500 flex flex-col justify-between">
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-[60px] group-hover:opacity-100 opacity-50 transition-all duration-500"></div>
                        
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold mb-4">
                                <Leaf className="w-3.5 h-3.5" />
                                {t('dashboard.eco.title', 'Dein Eco-Impact')}
                            </div>
                            <h3 className="text-3xl font-black text-white mb-2">{co2Saved}<span className="text-xl text-emerald-500 ml-1">{t('dashboard.eco.unit', 'kg')}</span></h3>
                            <p className="text-emerald-100/70 text-sm leading-relaxed">
                                {t('dashboard.eco.co2Desc', 'CO₂ eingespart durch reparierte oder generalüberholte Geräte anstatt Neukauf! 🌍')}
                            </p>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-emerald-500/20 pt-4 relative z-10">
                            <div>
                                <p className="text-[10px] text-emerald-400/60 uppercase font-bold tracking-wider">{t('dashboard.eco.eWasteTitle', 'Verhinderter E-Schrott')}</p>
                                <p className="text-white font-bold">{eWasteSaved.toFixed(2)} {t('dashboard.eco.unit', 'kg')}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
                                <Trophy className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Spending Analytics Chart (Span 8 or full depending on EcoImpact) */}
                <div className={`md:col-span-6 ${ecoSettings.enabled !== false ? 'xl:col-span-8' : 'xl:col-span-12'} bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 relative overflow-hidden group shadow-lg`}>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-brand-secondary drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                                {t('dashboard.spending.title', 'Ausgaben Übersicht')}
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">{t('dashboard.spending.desc', 'Deine gesamten Käufe der letzten 6 Monate')}</p>
                        </div>
                    </div>
                    
                    <div className="h-64 w-full relative z-10 min-w-0 min-h-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#e2e8f0', marginBottom: '4px', fontWeight: 'bold' }}
                                    formatter={(value: number | undefined) => [`€${Number(value || 0).toFixed(2)}`, 'Ausgaben']}
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="spent" 
                                    stroke="#06b6d4" 
                                    strokeWidth={4}
                                    strokeLinecap="round"
                                    fillOpacity={1} 
                                    fill="url(#colorSpent)" 
                                    activeDot={{ r: 8, fill: '#0f172a', stroke: '#06b6d4', strokeWidth: 3, className: "animate-pulse" }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Unified Timeline (Span 4) */}
                <div className="md:col-span-6 xl:col-span-4 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col relative overflow-hidden group shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                            {t('dashboard.activities.title', 'Aktivitäten')}
                        </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {(() => {
                            const activities = [
                                ...orders.map((o: any, i: number) => ({
                                    key: `order-${o._id || o.id || i}`,
                                    icon: <Package className="w-4 h-4 text-blue-400" />,
                                    iconBg: 'bg-blue-500/20 border-blue-500/30',
                                    title: `Bestellung #${o._id?.slice(-5)}`,
                                    date: o.createdAt
                                })),
                                ...repairs.map((r: any, i: number) => ({
                                    key: `repair-${r.id || r._id || i}`,
                                    icon: <Wrench className="w-4 h-4 text-purple-400" />,
                                    iconBg: 'bg-purple-500/20 border-purple-500/30',
                                    title: `Reparatur: ${r.device}`,
                                    date: r.date || r.createdAt
                                })),
                                ...valuations.map((v: any, i: number) => ({
                                    key: `val-${v.id || v._id || i}`,
                                    icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
                                    iconBg: 'bg-emerald-500/20 border-emerald-500/30',
                                    title: `Angebot: ${v.device}`,
                                    date: v.date || v.createdAt
                                }))
                            ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 5);

                            if (activities.length === 0) {
                                return (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-70">
                                        <Activity className="w-10 h-10 mb-3" />
                                        <p className="text-sm font-medium">{t('dashboard.activities.empty', 'Keine aktuellen Aktivitäten.')}</p>
                                    </div>
                                );
                            }

                            return activities.map((item, idx) => (
                                <div key={item.key} className="flex gap-4 group/item">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full border ${item.iconBg} flex items-center justify-center flex-shrink-0 z-10 shadow-sm transition-transform group-hover/item:scale-110`}>
                                            {item.icon}
                                        </div>
                                        {idx !== activities.length - 1 && (
                                            <div className="w-px h-full bg-white/5 mt-2 group-hover/item:bg-white/20 transition-colors"></div>
                                        )}
                                    </div>
                                    <div className="pb-4 pt-1">
                                        <p className="text-white text-sm font-medium group-hover/item:text-brand-primary transition-colors">{item.title}</p>
                                        <p className="text-xs text-slate-500 mt-1 font-mono">
                                            {item.date ? new Date(item.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                        </p>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                {/* 5. Mini Stats Row (Span 12, auto-fit) */}
                <div className="md:col-span-6 xl:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 sm:p-5 hover:bg-slate-800/50 transition-colors group">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <ShoppingCart className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-black text-white">{totalOrders}</p>
                        <p className="text-xs text-slate-400 mt-1">{t('dashboard.stats.orders', 'Gesamtbestellungen')}</p>
                    </div>
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 sm:p-5 hover:bg-slate-800/50 transition-colors group">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Wrench className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-black text-white">{repairs.length}</p>
                        <p className="text-xs text-slate-400 mt-1">{t('dashboard.stats.repairs', 'Reparatur-Historie')}</p>
                    </div>
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 sm:p-5 hover:bg-slate-800/50 transition-colors group">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-black text-white">{valuations.length}</p>
                        <p className="text-xs text-slate-400 mt-1">{t('dashboard.stats.valuations', 'Geräte verkauft')}</p>
                    </div>
                    {promotions.length > 0 ? (
                        <div className="bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 backdrop-blur-xl border border-brand-primary/30 rounded-2xl p-4 sm:p-5 hover:border-brand-primary/50 transition-colors relative overflow-hidden group hover:cursor-pointer" onClick={() => navigate('/marketplace')}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full blur-[40px] group-hover:bg-brand-primary/40 transition-all duration-700 -translate-y-1/2 translate-x-1/2"></div>
                            <h4 className="text-brand-primary font-black mb-1 drop-shadow-md">{t('dashboard.promotions.title', 'Special Offers! 🔥')}</h4>
                            <p className="text-xs text-white/80 line-clamp-2">{promotions[0].title}</p>
                            <p className="text-[10px] text-brand-primary/80 mt-2 flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform">{t('dashboard.promotions.cta', 'Jetzt entdecken')} <ArrowRight className="w-3 h-3" /></p>
                        </div>
                    ) : (
                         <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col justify-center">
                            <p className="text-sm text-slate-400 text-center">{t('dashboard.stats.comingSoon', 'Weitere Features bald verfügbar')}</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
