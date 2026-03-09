import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Box, MoreVertical, Edit2, X } from 'lucide-react';
import { Pagination } from './Pagination';

interface InventoryTableProps {
    itemsPageData: any[];
    processedItemsCount: number;
    itemsPage: number;
    setItemsPage: (page: number) => void;
    itemsPerPage: number;
    sortConfig: any;
    handleSort: (key: string) => void;
    handleEditClick: (item: any) => void;
    setSearchTerm: (term: string) => void;
    setTypeFilter: (filter: any) => void;
    setStockFilter: (filter: any) => void;
}

export function InventoryTable({
    itemsPageData,
    processedItemsCount,
    itemsPage,
    setItemsPage,
    itemsPerPage,
    sortConfig,
    handleSort,
    handleEditClick,
    setSearchTerm,
    setTypeFilter,
    setStockFilter
}: InventoryTableProps) {
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const tableRef = useRef<HTMLTableElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    return (
        <div className="w-full relative bg-slate-900/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left" ref={tableRef}>
                    <thead className="bg-slate-900/80 border-b border-slate-700/50 text-slate-400 text-sm">
                        <tr>
                            <th className="p-4 pl-6 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-1">Item {sortConfig?.key === 'name' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('barcode')}>
                                <div className="flex items-center gap-1">Barcode {sortConfig?.key === 'barcode' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('itemType')}>
                                <div className="flex items-center gap-1">Type {sortConfig?.key === 'itemType' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('supplierName')}>
                                <div className="flex items-center gap-1">Supplier {sortConfig?.key === 'supplierName' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('costPrice')}>
                                <div className="flex items-center gap-1">Cost {sortConfig?.key === 'costPrice' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('price')}>
                                <div className="flex items-center gap-1">Price {sortConfig?.key === 'price' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                            </th>
                            <th className="p-4 text-emerald-400">Profit</th>
                            <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('sold')}>
                                <div className="flex items-center gap-1">Sold {sortConfig?.key === 'sold' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('stock')}>
                                <div className="flex items-center gap-1">In Stock {sortConfig?.key === 'stock' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                            </th>
                            <th className="p-4">Value</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 relative">
                        {itemsPageData.map((item) => (
                            <tr key={item._id} className="transition-all duration-200 hover:bg-slate-800/60 group">
                                <td className="p-4 pl-6 font-bold text-white">
                                    <div className="flex items-center gap-3">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700/50" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-500">
                                                <Box size={20} />
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-sm">{item.name}</div>
                                            <div className="text-xs text-slate-500">{item.brand || 'No Brand'} {item.model ? `- ${item.model}` : ''}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 font-mono text-xs text-slate-400">
                                    {item.barcode ? item.barcode : <span className="text-slate-600 italic">No Barcode</span>}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm ${item.itemType === 'Product' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                                        item.itemType === 'RepairPart' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                            'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                                        }`}>
                                        {item.itemType === 'Product' ? 'Device' : item.itemType === 'RepairPart' ? 'Repair Part' : 'Accessory'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm text-slate-300">{item.supplierName || 'Unknown'}</div>
                                    <div className="text-xs text-slate-500">{item.supplierContact || ''}</div>
                                </td>
                                <td className="p-4 text-slate-300 font-mono text-sm">€{item.costPrice?.toFixed(2) || '0.00'}</td>
                                <td className="p-4 text-blue-400 font-bold text-sm">€{item.price?.toFixed(2) || '0.00'}</td>
                                <td className="p-4 text-emerald-400 font-bold text-sm">€{((item.price || 0) - (item.costPrice || 0)).toFixed(2)}</td>
                                <td className="p-4 text-slate-300 text-sm">
                                    <span className={item.sold < 0 ? 'text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20' : ''}>
                                        {item.sold}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md 
                                        ${item.stock > (item.minStock || 5) ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]' :
                                            item.stock > 0 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)]' :
                                                'bg-red-500/20 text-red-500 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                        }`}>
                                        {item.stock} {item.stock <= (item.minStock || 5) && item.stock > 0 && '(Low)'} {item.stock === 0 && '(Out)'}
                                    </span>
                                </td>
                                <td className="p-4 text-purple-400 font-mono text-sm">€{((item.stock || 0) * (item.costPrice || 0)).toFixed(2)}</td>
                                <td className="p-4 pr-6 text-right relative">
                                    <button
                                        onClick={(e) => toggleDropdown(item._id, e)}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent hover:border-slate-600/50"
                                        aria-label="Actions"
                                    >
                                        <MoreVertical size={18} />
                                    </button>

                                    {openDropdownId === item._id && (
                                        <div className="absolute right-6 top-10 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[50] animate-in fade-in slide-in-from-top-2">
                                            <button
                                                onClick={() => { handleEditClick(item); setOpenDropdownId(null); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
                                            >
                                                <Edit2 size={16} /> Edit Details
                                            </button>
                                            <button
                                                onClick={() => { handleEditClick(item); setOpenDropdownId(null); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-slate-700/50 flex items-center gap-2 transition-colors border-t border-slate-700/50"
                                            >
                                                <ArrowUpDown size={16} /> Restock
                                            </button>
                                            <button
                                                onClick={() => { handleEditClick(item); setOpenDropdownId(null); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-orange-400 hover:text-orange-300 hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
                                            >
                                                <Box size={16} /> Adjust Stock
                                            </button>
                                            <button
                                                onClick={() => { setOpenDropdownId(null); alert('View History is coming in Phase 4'); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-purple-400 hover:bg-slate-700/50 flex items-center gap-2 transition-colors border-t border-slate-700/50"
                                            >
                                                <MoreVertical size={16} /> View History
                                            </button>
                                            <button
                                                onClick={() => { setOpenDropdownId(null); alert('Delete functionality coming soon'); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:text-red-400 hover:bg-slate-700/50 flex items-center gap-2 transition-colors border-t border-slate-700/50"
                                            >
                                                <X size={16} /> Delete Item
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {itemsPageData.length === 0 && (
                            <tr>
                                <td colSpan={11} className="p-16 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                                        <Box size={48} className="text-slate-700/50 mb-2" />
                                        <p className="text-lg font-medium text-slate-400">No items match your filters</p>
                                        <p className="text-sm text-slate-600">Try adjusting your search criteria or clear the filters.</p>
                                        <button onClick={() => { setSearchTerm(''); setTypeFilter('All'); setStockFilter('All'); }} className="mt-4 px-4 py-2 border border-slate-700 hover:border-slate-500 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors">Clear Filters</button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={itemsPage} totalItems={processedItemsCount} itemsPerPage={itemsPerPage} setPage={setItemsPage} />
        </div >
    );
}
