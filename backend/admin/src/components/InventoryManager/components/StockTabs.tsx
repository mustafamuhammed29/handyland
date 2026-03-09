import React from 'react';
import { Box, ShoppingCart, FileText } from 'lucide-react';

interface StockTabsProps {
    activeTab: 'items' | 'sales' | 'history';
    setActiveTab: (tab: 'items' | 'sales' | 'history') => void;
}

export function StockTabs({ activeTab, setActiveTab }: StockTabsProps) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:pb-0">
            <button
                onClick={() => setActiveTab('items')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'items'
                    ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-900/30'
                    : 'bg-slate-900/40 text-slate-400 hover:bg-slate-800/80 hover:text-white border border-slate-700/50 backdrop-blur-md'
                    }`}
            >
                <Box size={18} /> Current Stock
            </button>
            <button
                onClick={() => setActiveTab('sales')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'sales'
                    ? 'bg-purple-600/90 text-white shadow-lg shadow-purple-900/30'
                    : 'bg-slate-900/40 text-slate-400 hover:bg-slate-800/80 hover:text-white border border-slate-700/50 backdrop-blur-md'
                    }`}
            >
                <ShoppingCart size={18} /> Recent Sales
            </button>
            <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'history'
                    ? 'bg-amber-600/90 text-white shadow-lg shadow-amber-900/30'
                    : 'bg-slate-900/40 text-slate-400 hover:bg-slate-800/80 hover:text-white border border-slate-700/50 backdrop-blur-md'
                    }`}
            >
                <FileText size={18} /> Stock History
            </button>
        </div>
    );
}
