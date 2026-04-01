import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Box, MoreVertical, Edit2, Trash2 } from 'lucide-react';
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
    handleInlineUpdate: (item: any, field: string, value: any) => Promise<any>;
    setSearchTerm: (term: string) => void;
    setTypeFilter: (filter: any) => void;
    setStockFilter: (filter: any) => void;
}

const InlineEditCell = ({ value, onSave, type = 'number', prefix = '' }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [val, setVal] = useState(value);
    const [loading, setLoading] = useState(false);

    useEffect(() => { setVal(value); }, [value]);

    const handleSave = async () => {
        if (Number(val) === Number(value)) { setIsEditing(false); return; }
        setLoading(true);
        const res = await onSave(Number(val));
        if (res?.success) setIsEditing(false);
        else setVal(value);
        setLoading(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1">
                {prefix && <span className="text-slate-500">{prefix}</span>}
                <input 
                    type={type} 
                    value={val} 
                    autoFocus
                    title={`Edit ${type}`}
                    placeholder={`Enter ${type}`}
                    onChange={(e) => setVal(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    className={`w-16 bg-slate-800 border ${loading ? 'border-slate-500' : 'border-blue-500'} text-white px-1.5 py-1 rounded text-sm focus:outline-none`} 
                    disabled={loading}
                />
            </div>
        );
    }
    
    return (
        <div 
            onClick={() => setIsEditing(true)} 
            className="cursor-text hover:bg-slate-700/50 px-2 py-1 -ml-2 rounded flex items-center gap-2 group transition-colors"
            title="Click to edit quickly"
        >
            <span className={prefix === '€' ? 'text-blue-400 font-bold' : ''}>
                {prefix}{type === 'number' && typeof value === 'number' ? (prefix === '€' ? value.toFixed(2) : value) : value}
            </span>
            <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

export function InventoryTable({
    itemsPageData,
    processedItemsCount,
    itemsPage,
    setItemsPage,
    itemsPerPage,
    sortConfig,
    handleSort,
    handleEditClick,
    handleInlineUpdate,
    setSearchTerm,
    setTypeFilter,
    setStockFilter
}: InventoryTableProps) {
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const tableRef = useRef<HTMLTableElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tableRef.current && !tableRef.current.contains(event.target as Node)) setOpenDropdownId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === id ? null : id);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === itemsPageData.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(itemsPageData.map(i => i._id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    return (
        <div className="w-full relative bg-slate-900/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-md">
            
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-blue-600/20 border-b border-blue-500/30 px-6 py-3 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">{selectedIds.size}</span>
                        <span className="text-blue-100 font-medium">Items Selected</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setSelectedIds(new Set()); alert('Bulk stock update coming in next phase!'); }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-600">
                            Bulk Update Stock
                        </button>
                        <button className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
                            <Trash2 size={14} /> Delete Selected
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left" ref={tableRef}>
                    <thead className="bg-slate-900/90 border-b border-slate-700/80 text-slate-300 text-[13px] uppercase tracking-wider font-semibold">
                        <tr>
                            <th className="p-4 w-12 pl-6">
                                <input 
                                    type="checkbox" 
                                    title="Select All"
                                    checked={selectedIds.size === itemsPageData.length && itemsPageData.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 cursor-pointer" 
                                />
                            </th>
                            <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-2">Item {sortConfig?.key === 'name' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('barcode')}>
                                <div className="flex items-center gap-2">Barcode {sortConfig?.key === 'barcode' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('itemType')}>
                                <div className="flex items-center gap-2">Type {sortConfig?.key === 'itemType' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('price')}>
                                <div className="flex items-center gap-2">Price {sortConfig?.key === 'price' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                            </th>
                            <th className="p-4">Profit <span className="text-[10px] text-slate-500 font-normal lowercase">(est.)</span></th>
                            <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('stock')}>
                                <div className="flex items-center gap-2">In Stock {sortConfig?.key === 'stock' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                            </th>
                            <th className="p-4 pl-0 pr-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 relative">
                        {itemsPageData.map((item) => (
                            <tr key={item._id} className={`transition-all duration-200 group ${selectedIds.has(item._id) ? 'bg-blue-900/20' : 'hover:bg-slate-800/60'}`}>
                                <td className="p-4 pl-6">
                                    <input 
                                        type="checkbox" 
                                        title="Select Item"
                                        checked={selectedIds.has(item._id)}
                                        onChange={() => toggleSelect(item._id)}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 cursor-pointer" 
                                    />
                                </td>
                                <td className="p-4 font-bold text-white">
                                    <div className="flex items-center gap-3 w-48 xl:w-64">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-700/50 shrink-0" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
                                                <Box size={22} />
                                            </div>
                                        )}
                                        <div className="truncate">
                                            <div className="text-[14px] font-bold truncate">{item.name}</div>
                                            <div className="text-[12px] text-slate-500 font-medium truncate">{item.brand || ''} {item.model ? `${item.model}` : 'Generic'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 font-mono text-xs text-slate-400">
                                    {item.barcode ? <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{item.barcode}</span> : <span className="text-slate-600 italic">No Barcode</span>}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm ${item.itemType === 'Product' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                                        item.itemType === 'RepairPart' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                            'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                                        }`}>
                                        {item.itemType === 'Product' ? 'Device' : item.itemType === 'RepairPart' ? 'Repair Part' : 'Accessory'}
                                    </span>
                                </td>
                                <td className="p-4 text-sm font-medium">
                                    <InlineEditCell 
                                        value={item.price} 
                                        prefix="€" 
                                        onSave={(val: number) => handleInlineUpdate(item, 'price', val)} 
                                    />
                                </td>
                                <td className="p-4 text-emerald-400 font-bold text-sm">€{((item.price || 0) - (item.costPrice || 0)).toFixed(2)}</td>
                                <td className="p-4 font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full shadow-sm ${item.stock === 0 ? 'bg-red-500 shadow-red-500/50' : item.stock <= (item.minStock || 5) ? 'bg-amber-500 shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}`}></div>
                                        <InlineEditCell 
                                            value={item.stock} 
                                            onSave={(val: number) => handleInlineUpdate(item, 'stock', val)} 
                                        />
                                    </div>
                                </td>
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
                                            <button onClick={() => { handleEditClick(item); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 flex items-center gap-2 transition-colors">
                                                <Edit2 size={16} /> Edit Details
                                            </button>
                                            <button onClick={() => { handleEditClick(item); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-slate-700/50 flex items-center gap-2 transition-colors border-t border-slate-700/50">
                                                <Box size={16} /> Advanced Stock
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {itemsPageData.length === 0 && (
                            <tr>
                                <td colSpan={10} className="p-16 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                                        <Box size={48} className="text-slate-700/50 mb-2" />
                                        <p className="text-lg font-medium text-slate-400">No items match your filters</p>
                                        <button onClick={() => { setSearchTerm(''); setTypeFilter('All'); setStockFilter('All'); }} className="mt-4 px-4 py-2 border border-slate-700 hover:border-slate-500 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors">Clear Filters</button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {processedItemsCount > 0 && (
                <Pagination currentPage={itemsPage} totalItems={processedItemsCount} itemsPerPage={itemsPerPage} setPage={setItemsPage} />
            )}
        </div >
    );
}
