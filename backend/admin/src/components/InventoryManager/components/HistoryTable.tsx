import React from 'react';
import { FileText } from 'lucide-react';
import { Pagination } from './Pagination';

interface HistoryTableProps {
    historyPageData: any[];
    totalHistory: number;
    historyPage: number;
    setHistoryPage: (page: number) => void;
    itemsPerPage: number;
}

export function HistoryTable({ historyPageData, totalHistory, historyPage, setHistoryPage, itemsPerPage }: HistoryTableProps) {
    return (
        <div className="w-full relative bg-slate-900/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left">
                    <thead className="bg-slate-900/80 border-b border-slate-700/50 text-slate-400 text-sm">
                        <tr>
                            <th className="p-4 pl-6">Date</th>
                            <th className="p-4">Item</th>
                            <th className="p-4">User</th>
                            <th className="p-4 text-center">Change</th>
                            <th className="p-4">Reason</th>
                            <th className="p-4 pr-6">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {historyPageData.map((log) => (
                            <tr key={log._id} className="transition-all duration-200 hover:bg-slate-800/60">
                                <td className="p-5 pl-6 text-sm text-slate-400">
                                    {new Date(log.createdAt).toLocaleDateString()} <span className="text-slate-500 text-[11px] font-mono ml-2 bg-slate-800/50 px-2 py-1 rounded-md">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm font-bold text-white">{log.itemName}</div>
                                    <div className="text-xs text-slate-500 font-mono">{log.barcode || 'No Barcode'} • {log.itemModel}</div>
                                </td>
                                <td className="p-4 text-sm text-slate-300">{log.userName}</td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-xs text-slate-500 line-through">{log.previousStock}</span>
                                        <span className={`font-bold ${log.changeAmount > 0 ? 'text-green-400' : log.changeAmount < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                            {log.changeAmount > 0 ? '+' : ''}{log.changeAmount}
                                        </span>
                                        <span className="text-sm text-white font-bold ml-2">→ {log.newStock}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm ${log.reason === 'Restock' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                        log.reason === 'Return' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                            log.reason === 'Sale' ? 'bg-purple-500/40 text-purple-300 border border-purple-500/50' :
                                                'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                                        }`}>
                                        {log.reason}
                                    </span>
                                </td>
                                <td className="p-4 pr-6 text-xs text-slate-400 max-w-[200px] truncate" title={log.notes}>
                                    {log.notes || '-'}
                                </td>
                            </tr>
                        ))}
                        {totalHistory === 0 && (
                            <tr>
                                <td colSpan={6} className="p-16 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                                        <FileText size={48} className="text-slate-700/50 mb-2" />
                                        <p className="text-lg font-medium text-slate-400">No stock history found</p>
                                        <p className="text-sm text-slate-600">Stock updates will be logged here.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={historyPage} totalItems={totalHistory} itemsPerPage={itemsPerPage} setPage={setHistoryPage} />
        </div>
    );
}
