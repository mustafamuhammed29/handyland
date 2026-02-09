import { useState, useEffect } from 'react';
import { ShoppingBag, ArrowUpRight, ArrowDownRight, Activity, Smartphone, Wrench } from 'lucide-react';

const StatCard = ({ title, value, change, trend, icon: Icon, color }: any) => (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon size={64} />
        </div>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
            {change && (
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {change}
                </div>
            )}
        </div>
        <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <div className="text-3xl font-black text-white">{value}</div>
    </div>
);

// Custom Simple Charts to avoid heavy libraries for now
const BarChart = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data.map(d => d.balance));
    return (
        <div className="flex justify-between items-end h-32 gap-2 mt-4">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-2 group w-full">
                    <div
                        className="w-full bg-blue-600 rounded-t-sm group-hover:bg-blue-500 transition-all relative"
                        style={{ height: `${(d.balance / max) * 100}%` }}
                    >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            €{d.balance}
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-500">{d.month}</span>
                </div>
            ))}
        </div>
    );
};

export default function Dashboard() {
    const [stats, setStats] = useState<any>({
        counts: { products: 0, accessories: 0, repairServices: 0, portfolioCases: 0 },
        recentActivity: []
    });
    const [revenueStats, setRevenueStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, revenueRes] = await Promise.all([
                    fetch('http://localhost:5000/api/stats'),
                    fetch('http://localhost:5000/api/stats/user')
                ]);
                const statsData = await statsRes.json();
                const revenueData = await revenueRes.json();
                setStats(statsData);
                setRevenueStats(revenueData);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in pb-12">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white">Dashboard Overview</h2>
                    <p className="text-slate-400 mt-2">Real-time platform analytics</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-colors">
                        Refresh Data
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Listings"
                    value={stats.counts.products}
                    change="Live"
                    trend="up"
                    icon={Smartphone}
                    color="text-emerald-500"
                />
                <StatCard
                    title="Repair Services"
                    value={stats.counts.repairServices}
                    change="Supported"
                    trend="up"
                    icon={Wrench}
                    color="text-blue-500"
                />
                <StatCard
                    title="Accessories"
                    value={stats.counts.accessories}
                    change="In Stock"
                    trend="up"
                    icon={ShoppingBag}
                    color="text-purple-500"
                />
                <StatCard
                    title="Portfolio Cases"
                    value={stats.counts.portfolioCases}
                    change="Archived"
                    trend="up"
                    icon={Activity}
                    color="text-amber-500"
                />
            </div>

            {/* Revenue Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-2">Revenue Trend</h3>
                    <p className="text-sm text-slate-400 mb-6">Gross income over the last 6 months</p>

                    {revenueStats && revenueStats.balanceTrend ? (
                        <BarChart data={revenueStats.balanceTrend} />
                    ) : (
                        <div className="h-32 flex items-center justify-center text-slate-500 text-sm">No revenue data available</div>
                    )}
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-2">Spending Distribution</h3>
                    <p className="text-sm text-slate-400 mb-6">Revenue by category</p>

                    <div className="space-y-4">
                        {revenueStats && revenueStats.spendingDistribution ? (
                            revenueStats.spendingDistribution.map((item: any) => (
                                <div key={item.name}>
                                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                                        <span>{item.name}</span>
                                        <span className="font-mono">€{item.value}</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${item.name === 'Purchases' ? 'bg-blue-500' : item.name === 'Accessories' ? 'bg-purple-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${(item.value / (revenueStats.spendingDistribution.reduce((a: any, b: any) => a + b.value, 0) || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-slate-500 py-8">No distribution data</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                        <button className="text-blue-400 text-sm hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        {stats.recentActivity.map((item: any) => (
                            <div key={item._id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800/50 hover:border-slate-700 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                                    <Smartphone size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="text-white font-bold text-sm">{item.model}</div>
                                    <div className="text-slate-500 text-xs">Added Recently • {item.brand}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-emerald-400 font-bold text-sm">€{item.price}</div>
                                    <div className="text-slate-500 text-xs">{item.condition}</div>
                                </div>
                            </div>
                        ))}
                        {stats.recentActivity.length === 0 && (
                            <div className="text-center text-slate-500 py-4">No recent activity</div>
                        )}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-white mb-2">System Status</h3>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-emerald-400 text-sm font-mono">ALL SYSTEMS OPERATIONAL</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Server Load</span>
                                    <span>24%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-[24%] bg-blue-500 rounded-full"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Database Usage</span>
                                    <span>45%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-[45%] bg-purple-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
