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
        border: 'border-slate-700/50 hover:border-slate-500/50', shadow: ''
    };

    if (stats.outOfStockCount && stats.outOfStockCount > 0) {
        alertTheme = { bgPulse: 'bg-red-500/10', text: 'text-red-400', icon: 'bg-red-500/10 text-red-500', border: 'border-red-500/50 hover:border-red-400/50', shadow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]' };
    } else if (stats.criticalStockCount && stats.criticalStockCount > 0) {
        alertTheme = { bgPulse: 'bg-amber-500/10', text: 'text-amber-400', icon: 'bg-amber-500/10 text-amber-500', border: 'border-amber-500/50 hover:border-amber-400/50', shadow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]' };
    } else if (stats.lowStockCount > 0) {
        alertTheme = { bgPulse: 'bg-orange-500/10', text: 'text-orange-400', icon: 'bg-orange-500/10 text-orange-500', border: 'border-orange-500/50 hover:border-orange-400/50', shadow: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]' };
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="group bg-slate-900/40 border border-slate-700/50 hover:border-blue-500/50 rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Total Items in Stock</p>
                        <h3 className="text-3xl font-black text-white">{stats.totalStock.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:scale-110 transition-transform duration-300">
                        <Package size={24} />
                    </div>
                </div>
            </div>

            <div className="group bg-slate-900/40 border border-slate-700/50 hover:border-emerald-500/50 rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Total Inventory Value</p>
                        <h3 className="text-3xl font-black text-white">€{stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                        <DollarSign size={24} />
                    </div>
                </div>
            </div>

            <div className={`group bg-slate-900/40 border ${alertTheme.border} rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 relative overflow-hidden ${alertTheme.shadow}`}>
                {totalAlerts > 0 && <div className={`absolute top-0 right-0 w-16 h-16 ${alertTheme.bgPulse} rounded-bl-full blur-xl animate-pulse`}></div>}
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Stock Alerts</p>
                        <div className="flex items-center gap-3">
                            <h3 className={`text-3xl font-black ${alertTheme.text}`}>{totalAlerts}</h3>
                            {totalAlerts > 0 && (
                                <div className="flex flex-col text-[10px] uppercase font-bold text-slate-500 leading-tight">
                                    {(stats.outOfStockCount || 0) > 0 && <span className="text-red-400">{stats.outOfStockCount} Out</span>}
                                    {(stats.criticalStockCount || 0) > 0 && <span className="text-amber-500">{stats.criticalStockCount} Crit</span>}
                                    {(stats.lowStockCount || 0) > 0 && <span className="text-orange-400">{stats.lowStockCount} Low</span>}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 ${alertTheme.icon}`}>
                        <AlertTriangle size={24} />
                    </div>
                </div>
            </div>

            <div className="group bg-slate-900/40 border border-slate-700/50 hover:border-purple-500/50 rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Total Revenue</p>
                        <h3 className="text-3xl font-black text-white">€{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp size={24} />
                    </div>
                </div>
            </div>
        </div>
    );
}
