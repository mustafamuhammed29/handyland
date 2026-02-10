import React from 'react';
import { BarChart3, TrendingUp, Shield, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SavedValuation } from '../../types';

interface DashboardValuationsProps {
    valuations: SavedValuation[];
    isLoading: boolean;
    onSell: (valId: string) => void;
}

export const DashboardValuations: React.FC<DashboardValuationsProps> = ({
    valuations,
    isLoading,
    onSell
}) => {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2].map(i => (
                    <div key={i} className="h-48 bg-slate-800/50 rounded-2xl"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Saved Valuations</h2>
                    <p className="text-slate-400 text-sm">Track the value of your devices over time.</p>
                </div>
                <button
                    onClick={() => navigate('/valuation')}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-slate-700"
                >
                    <Plus className="w-4 h-4" /> New Scan
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {valuations.map(val => (
                    <div
                        key={val.id}
                        className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/10 transition-colors"></div>

                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-slate-700 shadow-lg relative">
                                    <BarChart3 className="w-7 h-7 text-slate-300" />
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-slate-900">
                                        <TrendingUp className="w-3 h-3 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <div className="font-bold text-white text-lg">{val.device}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] uppercase font-bold text-slate-400">
                                            {val.specs?.split('•')[0] || '128GB'}
                                        </span>
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
                                    onClick={() => onSell(val.id)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    Sell Now <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {valuations.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-slate-500">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No valuations yet</p>
                        <p className="text-sm mb-4">Get an instant quote for your device</p>
                        <button
                            onClick={() => navigate('/valuation')}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-colors inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Start Valuation
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
