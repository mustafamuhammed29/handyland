import { ShoppingCart } from 'lucide-react';
import { Pagination } from './Pagination';

interface SalesTableProps {
    salesPageData: any[];
    totalSales: number;
    salesPage: number;
    setSalesPage: (page: number) => void;
    itemsPerPage: number;
}

export function SalesTable({ salesPageData, totalSales, salesPage, setSalesPage, itemsPerPage }: SalesTableProps) {
    return (
        <div className="w-full relative bg-slate-900/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left">
                    <thead className="bg-slate-900/80 border-b border-slate-700/50 text-slate-400 text-sm">
                        <tr>
                            <th className="p-4 pl-6">Date</th>
                            <th className="p-4">Order #</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Item Sold</th>
                            <th className="p-4">Qty</th>
                            <th className="p-4 pr-6 text-right">Revenue</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {salesPageData.map((sale, idx) => (
                            <tr key={`${sale.orderId}-${idx}`} className="transition-all duration-200 hover:bg-slate-800/60">
                                <td className="p-5 pl-6 text-sm text-slate-300">
                                    {new Date(sale.date).toLocaleDateString()} <span className="text-slate-500 text-[11px] font-mono ml-2 bg-slate-800/50 px-2 py-1 rounded-md">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </td>
                                <td className="p-4 text-sm font-mono text-slate-400">{sale.orderNumber}</td>
                                <td className="p-4 text-sm text-white">{sale.customer}</td>
                                <td className="p-4">
                                    <div className="text-sm font-medium text-white">{sale.productName}</div>
                                    <div className="text-xs text-slate-500">{sale.productType}</div>
                                </td>
                                <td className="p-4 text-sm font-bold text-slate-300">{sale.quantity}x</td>
                                <td className="p-4 pr-6 text-right text-purple-400 font-bold text-sm">
                                    €{sale.total.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        {totalSales === 0 && (
                            <tr>
                                <td colSpan={6} className="p-16 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                                        <ShoppingCart size={48} className="text-slate-700/50 mb-2" />
                                        <p className="text-lg font-medium text-slate-400">No recent sales found</p>
                                        <p className="text-sm text-slate-600">When sales are made, they will appear here.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={salesPage} totalItems={totalSales} itemsPerPage={itemsPerPage} setPage={setSalesPage} />
        </div>
    );
}
