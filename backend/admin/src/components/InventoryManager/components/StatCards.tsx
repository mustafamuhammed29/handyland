import { Package, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

interface StatCardsProps {
    stats: {
        totalStock: number;
        totalValue: number;
        lowStockCount: number;
        criticalStockCount?: number;
        outOfStockCount?: number;
        totalRevenue: number;
    };
}

export function StatCards({ stats }: StatCardsProps) {
    const totalAlerts = (stats.lowStockCount || 0) + (stats.criticalStockCount || 0) + (stats.outOfStockCount || 0);

    let alertTheme = {
        bgPulse: '', text: 'text-white', icon: 'bg-slate-800 text-slate-400',
        border: 'border-slate-700/50 hover:border-slate-500/50', shadow: '',
        gradient: 'from-slate-900/40 to-slate-800/20'
    };

    if (stats.outOfStockCount && stats.outOfStockCount > 0) {
        alertTheme = { bgPulse: 'bg-red-500/10', text: 'text-red-400', icon: 'bg-red-500/10 text-red-500', border: 'border-red-500/50 hover:border-red-400/50', shadow: 'hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]', gradient: 'from-slate-900/40 to-red-900/20' };
    } else if (stats.criticalStockCount && stats.criticalStockCount > 0) {
        alertTheme = { bgPulse: 'bg-amber-500/10', text: 'text-amber-400', icon: 'bg-amber-500/10 text-amber-500', border: 'border-amber-500/50 hover:border-amber-400/50', shadow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]', gradient: 'from-slate-900/40 to-amber-900/20' };
    } else if (stats.lowStockCount > 0) {
        alertTheme = { bgPulse: 'bg-orange-500/10', text: 'text-orange-400', icon: 'bg-orange-500/10 text-orange-500', border: 'border-orange-500/50 hover:border-orange-400/50', shadow: 'hover:shadow-[0_0_25px_rgba(249,115,22,0.2)]', gradient: 'from-slate-900/40 to-orange-900/20' };
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-2">
            <div className={`group bg-gradient-to-br from-slate-900/60 to-slate-800/30 border border-slate-700/50 hover:border-blue-500/50 rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1 overflow-hidden relative`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity opacity-50 group-hover:opacity-100"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <p className="text-slate-400 text-sm font-semibold tracking-wide mb-1 uppercase">Total Stock</p>
                        <h3 className="text-4xl font-black text-white tracking-tight">{stats.totalStock.toLocaleString()}</h3>
                    </div>
                    <div className="p-3.5 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:bg-blue-500/20 transition-colors duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                        <Package size={24} strokeWidth={2.5} />
                    </div>
                </div>
            </div>

            <div className={`group bg-gradient-to-br from-slate-900/60 to-slate-800/30 border border-slate-700/50 hover:border-emerald-500/50 rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 overflow-hidden relative`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity opacity-50 group-hover:opacity-100"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <p className="text-slate-400 text-sm font-semibold tracking-wide mb-1 uppercase">Inventory Value</p>
                        <h3 className="text-4xl font-black text-white tracking-tight">
                            <span className="text-emerald-400">€</span>{stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </h3>
                    </div>
                    <div className="p-3.5 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:bg-emerald-500/20 transition-colors duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                        <DollarSign size={24} strokeWidth={2.5} />
                    </div>
                </div>
            </div>

            <div className={`group bg-gradient-to-br ${alertTheme.gradient} border ${alertTheme.border} rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ${alertTheme.shadow}`}>
                {totalAlerts > 0 && <div className={`absolute top-0 right-0 w-32 h-32 ${alertTheme.bgPulse} rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none animate-pulse`}></div>}
                <div className="flex justify-between items-start mb-2 relative z-10">
                    <div>
                        <p className="text-slate-400 text-sm font-semibold tracking-wide mb-1 uppercase">Stock Alerts</p>
                        <h3 className={`text-4xl font-black tracking-tight ${alertTheme.text}`}>{totalAlerts}</h3>
                    </div>
                    <div className={`p-3.5 rounded-2xl transition-colors duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${alertTheme.icon}`}>
                        <AlertTriangle size={24} strokeWidth={2.5} />
                    </div>
                </div>
                {totalAlerts > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 relative z-10">
                        {(stats.outOfStockCount || 0) > 0 && (
                            <span className="px-2.5 py-1 bg-red-500/20 text-red-400 text-[11px] font-bold uppercase rounded-md border border-red-500/30">
                                {stats.outOfStockCount} Out
                            </span>
                        )}
                        {(stats.criticalStockCount || 0) > 0 && (
                            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-500 text-[11px] font-bold uppercase rounded-md border border-amber-500/30">
                                {stats.criticalStockCount} Critical
                            </span>
                        )}
                        {(stats.lowStockCount || 0) > 0 && (
                            <span className="px-2.5 py-1 bg-orange-500/20 text-orange-400 text-[11px] font-bold uppercase rounded-md border border-orange-500/30">
                                {stats.lowStockCount} Low
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className={`group bg-gradient-to-br from-slate-900/60 to-slate-800/30 border border-slate-700/50 hover:border-purple-500/50 rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1 overflow-hidden relative`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity opacity-50 group-hover:opacity-100"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <p className="text-slate-400 text-sm font-semibold tracking-wide mb-1 uppercase">Gross Revenue</p>
                        <h3 className="text-4xl font-black text-white tracking-tight">
                            <span className="text-purple-400">€</span>{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </h3>
                    </div>
                    <div className="p-3.5 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:bg-purple-500/20 transition-colors duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                        <TrendingUp size={24} strokeWidth={2.5} />
                    </div>
                </div>
            </div>
        </div>
    );
}
