import { Box, ShoppingCart, FileText } from 'lucide-react';

interface StockTabsProps {
    activeTab: 'items' | 'sales' | 'history';
    setActiveTab: (tab: 'items' | 'sales' | 'history') => void;
}

export function StockTabs({ activeTab, setActiveTab }: StockTabsProps) {
    return (
        <div className="flex bg-slate-900/40 p-1.5 rounded-2xl backdrop-blur-md border border-slate-700/50 w-full mb-6">
            <button
                onClick={() => setActiveTab('items')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'items'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`}
            >
                <Box size={18} className={activeTab === 'items' ? "text-blue-200" : "text-slate-500"} />
                Current Stock
            </button>
            <button
                onClick={() => setActiveTab('sales')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'sales'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`}
            >
                <ShoppingCart size={18} className={activeTab === 'sales' ? "text-blue-200" : "text-slate-500"} />
                Recent Sales
            </button>
            <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'history'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`}
            >
                <FileText size={18} className={activeTab === 'history' ? "text-blue-200" : "text-slate-500"} />
                Stock History
            </button>
        </div>
    );
}
