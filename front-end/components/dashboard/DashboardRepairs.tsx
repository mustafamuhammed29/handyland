import React, { useState } from 'react';
import { Wrench, MessageSquare, ChevronRight } from 'lucide-react';
import { RepairTicket } from '../../types';

interface DashboardRepairsProps {
    repairs: RepairTicket[];
    isLoading: boolean;
}

export const DashboardRepairs: React.FC<DashboardRepairsProps> = ({
    repairs,
    isLoading
}) => {
    const [expandedRepairId, setExpandedRepairId] = useState<string | null>(null);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ready': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            case 'repairing': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            case 'diagnosing': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
            case 'testing': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
            case 'received': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
            case 'attention': return 'bg-red-500/10 text-red-400 border-red-500/30';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
        }
    };

    const getStatusStep = (status: string) => {
        switch (status) {
            case 'received': return 1;
            case 'diagnosing': return 2;
            case 'repairing': return 3;
            case 'testing': return 4;
            case 'ready': return 5;
            case 'attention': return 2; // Show as early stage needing attention
            default: return 1;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2].map(i => (
                    <div key={i} className="h-32 bg-slate-800/50 rounded-2xl"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Active Repairs</h2>

            <div className="space-y-4">
                {repairs.map((ticket) => (
                    <div
                        key={ticket.id}
                        className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center relative">
                                        <Wrench className="w-6 h-6 text-cyan-400" />
                                        {ticket.status === 'attention' && (
                                            <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                            {ticket.device}
                                            <span className="text-xs font-normal text-slate-500 font-mono">#{ticket.id}</span>
                                        </h3>
                                        <p className="text-sm text-slate-400">{ticket.issue}</p>
                                    </div>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(ticket.status)}`}>
                                    {ticket.status}
                                </span>
                            </div>

                            {/* Timeline */}
                            <div className="relative px-2 mb-8">
                                <div className="h-1 bg-slate-800 w-full absolute top-1/2 -translate-y-1/2 left-0 right-0 z-0 rounded-full"></div>
                                <div
                                    className="h-1 bg-cyan-500 absolute top-1/2 -translate-y-1/2 left-0 z-0 transition-all duration-1000 rounded-full"
                                    style={{ width: `${(getStatusStep(ticket.status) / 5) * 100}%` }}
                                ></div>

                                <div className="relative z-10 flex justify-between">
                                    {['Received', 'Diag', 'Repair', 'Test', 'Ready'].map((step, idx) => {
                                        const currentStep = idx + 1;
                                        const active = currentStep <= getStatusStep(ticket.status);
                                        return (
                                            <div key={step} className="flex flex-col items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full border-2 transition-colors ${active
                                                    ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_10px_#06b6d4]'
                                                    : 'bg-slate-900 border-slate-700'
                                                    }`}></div>
                                                <span className={`text-[10px] font-bold uppercase ${active ? 'text-cyan-400' : 'text-slate-600'
                                                    }`}>{step}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="text-xs text-slate-500">
                                        Est. Completion: <span className="text-white font-bold">Today, 6:00 PM</span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Cost: <span className="text-cyan-400 font-bold">€{ticket.cost}</span>
                                    </div>
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

                        {/* Expanded Details */}
                        {expandedRepairId === ticket.id && (
                            <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2">
                                <div className="h-px bg-slate-800 mb-6"></div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" /> Technician Notes
                                    </h4>
                                    <div className="bg-black/30 rounded-xl p-4 border border-slate-800/50">
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            Device successfully opened. Found moderate water damage on the logic board near the charging port. Cleaning needed before screen replacement.
                                        </p>
                                        <div className="mt-2 text-[10px] text-slate-600 font-mono text-right">
                                            Added 2 hours ago by Alex
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {repairs.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <Wrench className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No active repairs</p>
                    </div>
                )}
            </div>
        </div>
    );
};
