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

export default function Dashboard() {
    const [stats, setStats] = useState<any>({
        counts: { products: 0, accessories: 0, repairServices: 0, portfolioCases: 0 },
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/stats')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    if (loading) return <div className="p-8 text-white">Loading Dashboard...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white">Dashboard Overview</h2>
                    <p className="text-slate-400 mt-2">Real-time platform analytics</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-colors">
                        Last 24 Hours
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-colors">
                        Last 7 Days
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
                                    <div className="text-emerald-400 font-bold text-sm">${item.price}</div>
                                    <div className="text-slate-500 text-xs">{item.condition}</div>
                                </div>
                            </div>
                        ))}
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
