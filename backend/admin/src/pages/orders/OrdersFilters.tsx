import React from 'react';
import { Search, Filter, Calendar } from 'lucide-react';

interface OrdersFiltersProps {
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    dateRange: { start: string; end: string };
    setDateRange: React.Dispatch<React.SetStateAction<{ start: string; end: string }>>;
    selectedStatus: string;
    setSelectedStatus: (v: string) => void;
    setPage: (v: number) => void;
}

export const OrdersFilters = ({
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    selectedStatus,
    setSelectedStatus,
    setPage
}: OrdersFiltersProps) => {
    return (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by order number, customer name, email..."
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-950/50 border border-slate-700/80 rounded-xl px-3 py-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input 
                            type="date" 
                            className="bg-transparent text-sm text-slate-300 focus:outline-none"
                            value={dateRange.start}
                            onChange={e => { setDateRange(prev => ({...prev, start: e.target.value})); setPage(1); }}
                            aria-label="Start Date"
                        />
                        <span className="text-slate-500">-</span>
                        <input 
                            type="date" 
                            className="bg-transparent text-sm text-slate-300 focus:outline-none"
                            value={dateRange.end}
                            onChange={e => { setDateRange(prev => ({...prev, end: e.target.value})); setPage(1); }}
                            aria-label="End Date"
                        />
                    </div>
                    <div className="flex items-center gap-2 relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <Filter className="w-4 h-4 text-slate-400" />
                        </div>
                        <select
                            aria-label="Filter Orders by Status"
                            className="pl-9 pr-8 py-2.5 bg-slate-950/50 border border-slate-700/80 rounded-xl text-white appearance-none focus:outline-none focus:border-indigo-500 transition-all"
                            value={selectedStatus}
                            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};
