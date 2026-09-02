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
                <div className="md:col-span-6 xl:col-span-8 h-48 bg-white/80 dark:bg-slate-900/40 rounded-3xl animate-pulse"></div>
                <div className="md:col-span-6 xl:col-span-4 h-48 bg-white/80 dark:bg-slate-900/40 rounded-3xl animate-pulse"></div>
                <div className="md:col-span-6 xl:col-span-8 h-80 bg-white/80 dark:bg-slate-900/40 rounded-3xl animate-pulse"></div>
                <div className="md:col-span-6 xl:col-span-4 h-80 bg-white/80 dark:bg-slate-900/40 rounded-3xl animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 gap-6 auto-rows-min">
                
                {/* 1. Hero Welcome Card (Span 8) */}
                <div className="md:col-span-6 xl:col-span-8 relative overflow-hidden bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 dark:border-brand-primary/30 p-6 sm:p-8 rounded-3xl group transition-all duration-500">
                    <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-brand-primary/10 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
                    
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 z-10 relative h-full">
                        <div className="w-full xl:w-auto flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    {React.cloneElement(greeting.icon, { className: "w-6 h-6 text-brand-primary" })}
                                </div>
                                <h2 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                                    {greeting.text}, <br className="sm:hidden" />
                                    <span className="text-brand-primary">
                                        {userName?.split(' ')[0] || t('common.member', 'Member')}
                                    </span>
                                </h2>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md leading-relaxed">
                                {pendingOrders > 0 || activeRepairs > 0 
                                    ? t('dashboard.hero.statusUpdate', { defaultValue: `Du hast ${pendingOrders} aktive Bestellungen und ${activeRepairs} Reparaturen in Bearbeitung.`, pendingOrders, activeRepairs })
                                    : t('dashboard.hero.allClear', 'Alles auf dem neuesten Stand. Entdecke neue Angebote im Marktplatz oder starte eine Reparatur.')}
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                                <button onClick={() => navigate('/marketplace')} className="w-full sm:w-auto px-5 py-2.5 bg-brand-primary text-slate-900 rounded-xl font-bold text-sm hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm">
                                    <Package className="w-4 h-4" />
                                    {t('dashboard.hero.marketplace', 'Marktplatz')}
                                </button>
                                <button onClick={() => navigate('/repair')} className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2 shadow-sm">
                                    <Wrench className="w-4 h-4 text-brand-secondary" />
                                    {t('dashboard.hero.newRepair', 'Neue Reparatur')}
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex w-full xl:w-auto shrink-0 mt-2 xl:mt-0">
                            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl p-5 flex-1 sm:w-48 relative">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                                    <Activity className="w-4 h-4 text-brand-primary" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">{t('dashboard.hero.active', 'Aktive Vorgänge')}</span>
                                </div>
                                <div className="flex items-end gap-2 mt-2">
                                    <p className="text-4xl font-black text-slate-900 dark:text-white">{pendingOrders + activeRepairs + pendingValuations}</p>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 mt-4 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-primary w-full" style={{ width: '100%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Stunning Loyalty & Rewards Card (Span 4) */}
                {settings?.features?.loyalty?.enabled !== false && (
                    <div className="md:col-span-6 xl:col-span-4 relative overflow-hidden bg-slate-900 dark:bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-lg transition-all duration-500 text-white">
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-primary/20 blur-[60px] rounded-full pointer-events-none"></div>

                        <div className="z-10 relative h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase mb-1">{t('dashboard.rewardsTier', 'Mitgliedschaft')}</p>
                                    <h3 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                                        <ShieldCheck className="w-6 h-6 text-brand-primary" />
                                        {user?.membershipLevel === 4 ? t('dashboard.rewards.tier.platinum', 'Platinum') : user?.membershipLevel === 3 ? t('dashboard.rewards.tier.gold', 'Gold') : user?.membershipLevel === 2 ? t('dashboard.rewards.tier.silver', 'Silver') : t('dashboard.rewards.tier.member', 'Member')}
                                    </h3>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-4xl sm:text-5xl font-black tracking-tighter">
                                        {user?.loyaltyPoints || 0} <span className="text-base font-bold text-slate-400 tracking-normal">Punkte</span>
                                    </span>
                                </div>
                                
                                <div className="w-full bg-slate-800 rounded-full h-2.5 mb-2 overflow-hidden border border-slate-700 relative">
                                    {user?.membershipLevel === 4 ? (
                                        <div className="bg-brand-primary h-full rounded-full" style={{ width: '100%' }}></div>
                                    ) : (
                                        <div className="bg-brand-primary h-full rounded-full" style={{ width: `${Math.min(((user?.loyaltyPoints || 0) % 2000) / 2000 * 100, 100)}%` }}></div>
                                    )}
                                </div>
                                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
                                    {user?.membershipLevel === 4 ? t('dashboard.rewards.maxTier', 'Höchstes Level erreicht') : t('dashboard.rewards.nextTier', { defaultValue: 'Noch {{pts}} Punkte bis zum nächsten Level', pts: 2000 - ((user?.loyaltyPoints || 0) % 2000) })}
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
                        <div className="md:col-span-6 xl:col-span-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6 text-brand-primary" })}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
                                    <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
                                        <Activity className="w-4 h-4 text-brand-primary animate-pulse" /> {t('dashboard.tracking.live', 'Live Status')}
                                    </p>
                                </div>
                            </div>

                            {/* Stepper */}
                            <div className="relative flex justify-between items-center max-w-4xl mx-auto mt-4 mb-4 px-4 sm:px-10">
                                {/* Base Progress Line */}
                                <div className="absolute top-4 left-10 right-10 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                {/* Active Progress Line */}
                                <div 
                                    className="absolute top-4 left-10 h-1.5 bg-brand-primary rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - 40px)` }}
                                ></div>

                                {steps.map((step, idx) => {
                                    const isCompleted = idx < currentStepIndex;
                                    const isActive = idx === currentStepIndex;
                                    
                                    return (
                                        <div key={step.id} className="relative flex flex-col items-center group">
                                            {/* Step Circle */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 relative z-10 transition-all duration-500
                                                ${isCompleted ? 'bg-brand-primary border-brand-primary text-white shadow-md' : 
                                                  isActive ? 'bg-white dark:bg-slate-900 border-brand-primary text-brand-primary shadow-md' : 
                                                  'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}
                                            >
                                                {isCompleted ? <ShieldCheck className="w-5 h-5" /> : 
                                                 <span className="text-sm font-bold">{idx + 1}</span>}
                                            </div>
                                            
                                            {/* Label */}
                                            <span className={`absolute top-14 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors duration-300
                                                ${isCompleted || isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
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
                    <div className="md:col-span-6 xl:col-span-4 relative overflow-hidden bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 p-6 sm:p-8 rounded-3xl transition-all duration-500 flex flex-col justify-between">
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-800/40 rounded-full text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-4">
                                <Leaf className="w-3.5 h-3.5" />
                                {t('dashboard.eco.title', 'Dein Eco-Impact')}
                            </div>
                            <h3 className="text-3xl font-black text-emerald-900 dark:text-white mb-2">{co2Saved}<span className="text-xl text-emerald-600 dark:text-emerald-400 ml-1">{t('dashboard.eco.unit', 'kg')}</span></h3>
                            <p className="text-emerald-700/80 dark:text-emerald-200/70 text-sm leading-relaxed">
                                {t('dashboard.eco.co2Desc', 'CO₂ eingespart durch reparierte oder generalüberholte Geräte anstatt Neukauf! 🌍')}
                            </p>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-emerald-200 dark:border-emerald-800/50 pt-4 relative z-10">
                            <div>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400/80 uppercase font-bold tracking-wider">{t('dashboard.eco.eWasteTitle', 'Verhinderter E-Schrott')}</p>
                                <p className="text-emerald-900 dark:text-white font-bold">{eWasteSaved.toFixed(2)} {t('dashboard.eco.unit', 'kg')}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Trophy className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Spending Analytics Chart (Span 8 or full depending on EcoImpact) */}
                <div className={`md:col-span-6 ${ecoSettings.enabled !== false ? 'xl:col-span-8' : 'xl:col-span-12'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm`}>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-brand-primary" />
                                {t('dashboard.spending.title', 'Ausgaben Übersicht')}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.spending.desc', 'Deine gesamten Käufe der letzten 6 Monate')}</p>
                        </div>
                    </div>
                    
                    <div className="h-64 w-full relative z-10 min-w-0 min-h-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
                                <XAxis dataKey={t('name')} stroke="#94a3b8" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#1e293b', marginBottom: '4px', fontWeight: 'bold' }}
                                    formatter={(value: number | undefined) => [`€${Number(value || 0).toFixed(2)}`, 'Ausgaben']}
                                    cursor={{ stroke: 'rgba(6,182,212,0.2)', strokeWidth: 2 }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="spent" 
                                    stroke="#06b6d4" 
                                    strokeWidth={3}
                                    strokeLinecap="round"
                                    fillOpacity={1} 
                                    fill="url(#colorSpent)" 
                                    activeDot={{ r: 6, fill: '#fff', stroke: '#06b6d4', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Unified Timeline (Span 4) */}
                <div className="md:col-span-6 xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col relative overflow-hidden shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-slate-400" />
                            {t('dashboard.activities.title', 'Aktivitäten')}
                        </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-0">
                        {(() => {
                            const activities = [
                                ...orders.map((o: any, i: number) => ({
                                    key: `order-${o._id || o.id || i}`,
                                    icon: <Package className="w-4 h-4 text-brand-primary" />,
                                    iconBg: 'bg-brand-primary/10',
                                    title: `Bestellung #${o._id?.slice(-5)}`,
                                    date: o.createdAt
                                })),
                                ...repairs.map((r: any, i: number) => ({
                                    key: `repair-${r.id || r._id || i}`,
                                    icon: <Wrench className="w-4 h-4 text-purple-500" />,
                                    iconBg: 'bg-purple-500/10',
                                    title: `Reparatur: ${r.device}`,
                                    date: r.date || r.createdAt
                                })),
                                ...valuations.map((v: any, i: number) => ({
                                    key: `val-${v.id || v._id || i}`,
                                    icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
                                    iconBg: 'bg-emerald-500/10',
                                    title: `Angebot: ${v.device}`,
                                    date: v.date || v.createdAt
                                }))
                            ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 5);

                            if (activities.length === 0) {
                                return (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <Activity className="w-10 h-10 mb-3 opacity-50" />
                                        <p className="text-sm font-medium">{t('dashboard.activities.empty', 'Keine aktuellen Aktivitäten.')}</p>
                                    </div>
                                );
                            }

                            return activities.map((item, idx) => (
                                <div key={item.key} className="flex gap-4 group/item">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-9 h-9 rounded-full ${item.iconBg} flex items-center justify-center flex-shrink-0 z-10 transition-transform group-hover/item:scale-110`}>
                                            {item.icon}
                                        </div>
                                        {idx !== activities.length - 1 && (
                                            <div className="w-px h-full bg-slate-200 dark:bg-slate-700 mt-2 mb-2 group-hover/item:bg-slate-300 transition-colors"></div>
                                        )}
                                    </div>
                                    <div className="pb-4 pt-1.5">
                                        <p className="text-slate-900 dark:text-white text-sm font-semibold">{item.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
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
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm group">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <ShoppingCart className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{totalOrders}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">{t('dashboard.stats.orders', 'Gesamtbestellungen')}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm group">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Wrench className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{repairs.length}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">{t('dashboard.stats.repairs', 'Reparatur-Historie')}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm group">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{valuations.length}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">{t('dashboard.stats.valuations', 'Geräte verkauft')}</p>
                    </div>
                    {promotions.length > 0 ? (
                        <div className="bg-gradient-to-br from-brand-primary to-cyan-500 text-white rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-all relative overflow-hidden group hover:cursor-pointer shadow-sm" onClick={() => navigate('/marketplace')}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-[40px] group-hover:bg-white/30 transition-all duration-700 -translate-y-1/2 translate-x-1/2"></div>
                            <h4 className="font-bold mb-1">{t('dashboard.promotions.title', 'Special Offers! 🔥')}</h4>
                            <p className="text-xs text-white/90 line-clamp-2">{promotions[0].title}</p>
                            <p className="text-[10px] text-white mt-2 flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform">{t('dashboard.promotions.cta', 'Jetzt entdecken')} <ArrowRight className="w-3 h-3" /></p>
                        </div>
                    ) : (
                         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-center shadow-sm">
                            <p className="text-sm text-slate-500 text-center">{t('dashboard.stats.comingSoon', 'Weitere Features bald verfügbar')}</p>
                        </div>
                    )}
                </div>

                {/* 6. Quick Actions Banner */}
                <div className="md:col-span-6 xl:col-span-12">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 relative z-10">
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-brand-primary" />
                                </div>
                                <div>
                                    <p className="text-slate-900 dark:text-white font-bold text-sm">{t('dashboard.quickActions.title', 'Schnellzugriff')}</p>
                                    <p className="text-slate-500 text-xs">{t('dashboard.quickActions.subtitle', 'Direkt zu deinen wichtigsten Bereichen')}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 sm:ml-auto">
                                <button
                                    onClick={() => navigate('/marketplace')}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-sm font-semibold rounded-xl transition-all hover:scale-105 active:scale-95"
                                >
                                    <Package className="w-4 h-4" />
                                    {t('dashboard.hero.marketplace', 'Marktplatz')}
                                </button>
                                <button
                                    onClick={() => navigate('/repair')}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 text-sm font-semibold rounded-xl transition-all hover:scale-105 active:scale-95"
                                >
                                    <Wrench className="w-4 h-4" />
                                    {t('dashboard.hero.newRepair', 'Reparatur buchen')}
                                </button>
                                <button
                                    onClick={() => navigate('/valuation')}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-sm font-semibold rounded-xl transition-all hover:scale-105 active:scale-95"
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    {t('dashboard.quickActions.sell', 'Gerät verkaufen')}
                                </button>
                                <button
                                    onClick={() => navigate('/marketplace?section=accessories')}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-sm font-semibold rounded-xl transition-all hover:scale-105 active:scale-95"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    {t('dashboard.quickActions.accessories', 'Zubehör')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
