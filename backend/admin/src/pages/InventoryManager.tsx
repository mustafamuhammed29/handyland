import React, { useEffect, useState, useMemo } from 'react';
import { Package, TrendingUp, AlertTriangle, DollarSign, Edit2, X, Save, Box, ShoppingCart, FileText, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../utils/api';

export default function InventoryManager() {
    const [stats, setStats] = useState({
        totalStock: 0,
        totalValue: 0,
        lowStockCount: 0,
        totalItemsSold: 0,
        totalRevenue: 0
    });

    const [items, setItems] = useState<any[]>([]);
    const [sales, setSales] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'items' | 'sales' | 'history'>('items');
    const [searchTerm, setSearchTerm] = useState('');

    // --- Advanced Filters, Sort, and Pagination State ---
    const [typeFilter, setTypeFilter] = useState<'All' | 'Product' | 'Accessory' | 'RepairPart'>('All');
    const [stockFilter, setStockFilter] = useState<'All' | 'Low' | 'Out'>('All');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    // Pagination
    const [itemsPage, setItemsPage] = useState(1);
    const [salesPage, setSalesPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const itemsPerPage = 15;

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [editForm, setEditForm] = useState({ stock: 0, price: 0, reason: 'Manual Correction', notes: '' });

    // Add Repair Part State
    const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
    const [addPartForm, setAddPartForm] = useState({
        name: '', subCategory: '', brand: '', price: 0, cost: 0, stock: 0, minStock: 5, barcode: '', supplier: '', image: '', description: ''
    });

    const fetchInventoryData = async () => {
        setLoading(true);
        try {
            const [statsRes, itemsRes, salesRes, historyRes] = await Promise.all([
                api.get('/api/inventory/stats'),
                api.get('/api/inventory/items'),
                api.get('/api/inventory/sales?limit=100'),
                api.get('/api/inventory/history?limit=100')
            ]);

            if (statsRes.data?.success) setStats(statsRes.data.data);
            if (itemsRes.data?.success) setItems(itemsRes.data.data);
            if (salesRes.data?.success) setSales(salesRes.data.data);
            if (historyRes.data?.success) setHistory(historyRes.data.data);

        } catch (error) {
            console.error("Failed to load inventory data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventoryData();
    }, []);

    const handleEditClick = (item: any) => {
        setEditingItem(item);
        setEditForm({ stock: item.stock, price: item.price, reason: 'Manual Correction', notes: '' });
        setIsEditModalOpen(true);
    };

    const handleUpdateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const endpoint = `/api/inventory/${editingItem.itemType}/${editingItem._id}/stock`;

            // Unified stock update endpoint
            await api.put(endpoint, {
                stock: editForm.stock,
                price: editForm.price,
                reason: editForm.reason,
                notes: editForm.notes
            });

            setIsEditModalOpen(false);
            setEditingItem(null);
            fetchInventoryData(); // Refresh all data
        } catch (error) {
            console.error("Failed to update item", error);
            alert("Failed to update item.");
        }
    };

    const handleAddPartSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/api/repair-parts', addPartForm);
            setIsAddPartModalOpen(false);
            fetchInventoryData();
            setAddPartForm({
                name: '', subCategory: '', brand: '', price: 0, cost: 0, stock: 0, minStock: 5, barcode: '', supplier: '', image: '', description: ''
            });
            alert("Repair Part added successfully!");
        } catch (error: any) {
            console.error("Error saving part:", error);
            alert(error.response?.data?.message || "Error saving part. Check barcode uniqueness.");
        }
    };

    // --- Computed Logic ---
    const processedItems = useMemo(() => {
        let result = items;

        // 1. Search
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(item =>
                (item.name && item.name.toLowerCase().includes(searchLower)) ||
                (item.barcode && item.barcode.toLowerCase() === searchLower) ||
                (item.barcode && item.barcode.toLowerCase().includes(searchLower)) ||
                (item.category && item.category.toLowerCase().includes(searchLower))
            );
        }

        // 2. Type Filter
        if (typeFilter !== 'All') {
            result = result.filter(item => item.itemType === typeFilter);
        }

        // 3. Stock Filter
        if (stockFilter === 'Low') {
            result = result.filter(item => item.stock > 0 && item.stock <= (item.minStock || 5));
        } else if (stockFilter === 'Out') {
            result = result.filter(item => item.stock === 0);
        }

        // 4. Sort
        if (sortConfig !== null) {
            result.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [items, searchTerm, typeFilter, stockFilter, sortConfig]);

    // Pagination Slices
    const itemsPageData = useMemo(() => {
        const startIndex = (itemsPage - 1) * itemsPerPage;
        return processedItems.slice(startIndex, startIndex + itemsPerPage);
    }, [processedItems, itemsPage]);

    const salesPageData = useMemo(() => {
        const startIndex = (salesPage - 1) * itemsPerPage;
        return sales.slice(startIndex, startIndex + itemsPerPage);
    }, [sales, salesPage]);

    const historyPageData = useMemo(() => {
        const startIndex = (historyPage - 1) * itemsPerPage;
        return history.slice(startIndex, startIndex + itemsPerPage);
    }, [history, historyPage]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Helper for pagination rendering
    const renderPagination = (currentPage: number, totalItems: number, setPage: (page: number) => void) => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) return null;

        return (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-t border-slate-800">
                <div className="text-sm text-slate-400">
                    Showing <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-medium text-white">{totalItems}</span> results
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        title="Previous Page"
                        aria-label="Previous Page"
                        className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-medium text-slate-300 px-4 py-1.5 bg-slate-950 rounded-lg border border-slate-800">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        title="Next Page"
                        aria-label="Next Page"
                        className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Inventory & Sales</h2>
                <p className="text-slate-400">Manage your entire stock and view sales history</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-400 text-sm font-medium mb-1">Total Items in Stock</p>
                            <h3 className="text-3xl font-black text-white">{stats.totalStock.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                            <Package size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-400 text-sm font-medium mb-1">Total Inventory Value</p>
                            <h3 className="text-3xl font-black text-white">€{stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </div>

                <div className={`bg-slate-900/50 border ${stats.lowStockCount > 0 ? 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'border-slate-800'} rounded-2xl p-6 backdrop-blur-sm transition-all`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-400 text-sm font-medium mb-1">Low Stock Alerts</p>
                            <h3 className={`text-3xl font-black ${stats.lowStockCount > 0 ? 'text-orange-400' : 'text-white'}`}>{stats.lowStockCount}</h3>
                        </div>
                        <div className={`p-3 rounded-xl ${stats.lowStockCount > 0 ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-400 text-sm font-medium mb-1">Total Revenue</p>
                            <h3 className="text-3xl font-black text-white">€{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs & Search & Filters */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setActiveTab('items')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'items'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                            : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                            }`}
                    >
                        <Box size={20} /> Current Stock
                    </button>
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'sales'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                            : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                            }`}
                    >
                        <ShoppingCart size={20} /> Recent Sales
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'history'
                            ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20'
                            : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                            }`}
                    >
                        <FileText size={20} /> Stock History
                    </button>
                </div>

                <div className="flex flex-wrap gap-4 w-full md:w-auto items-center">
                    {activeTab === 'items' && (
                        <>
                            <div className="relative max-w-xs w-full shrink-0">
                                <input
                                    type="text"
                                    placeholder="Scan Barcode or Search..."
                                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 pl-10 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setItemsPage(1); }}
                                />
                                <div className="absolute left-3 top-3.5 text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" /><path d="M17 5v14" /><path d="M21 5v14" /></svg>
                                </div>
                            </div>

                            <select
                                title="Filter by Item Type"
                                aria-label="Filter by Item Type"
                                className="bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-white appearance-none outline-none focus:border-blue-500 min-w-[130px]"
                                value={typeFilter}
                                onChange={(e: any) => { setTypeFilter(e.target.value); setItemsPage(1); }}
                            >
                                <option value="All">All Types</option>
                                <option value="Product">Devices</option>
                                <option value="Accessory">Accessories</option>
                                <option value="RepairPart">Repair Parts</option>
                            </select>

                            <select
                                title="Filter by Stock Status"
                                aria-label="Filter by Stock Status"
                                className="bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3 text-white appearance-none outline-none focus:border-blue-500 min-w-[130px]"
                                value={stockFilter}
                                onChange={(e: any) => { setStockFilter(e.target.value); setItemsPage(1); }}
                            >
                                <option value="All">All Stock</option>
                                <option value="Low">Low Stock</option>
                                <option value="Out">Out of Stock</option>
                            </select>
                        </>
                    )}

                    <button
                        onClick={() => setIsAddPartModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shrink-0 flex items-center gap-2 ml-auto. md:ml-0"
                    >
                        + Add Repair Part
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                {loading ? (
                    <div className="p-20 text-center text-slate-400">Loading data...</div>
                ) : activeTab === 'items' ? (
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-sm">
                                    <th className="p-4 pl-6 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                                        <div className="flex items-center gap-1">Item {sortConfig?.key === 'name' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('barcode')}>
                                        <div className="flex items-center gap-1">Barcode {sortConfig?.key === 'barcode' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('itemType')}>
                                        <div className="flex items-center gap-1">Type {sortConfig?.key === 'itemType' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('category')}>
                                        <div className="flex items-center gap-1">Category {sortConfig?.key === 'category' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('price')}>
                                        <div className="flex items-center gap-1">Price {sortConfig?.key === 'price' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('sold')}>
                                        <div className="flex items-center gap-1">Sold {sortConfig?.key === 'sold' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                                    </th>
                                    <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('stock')}>
                                        <div className="flex items-center gap-1">In Stock {sortConfig?.key === 'stock' && <ArrowUpDown size={14} className="text-blue-400" />}</div>
                                    </th>
                                    <th className="p-4 pr-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {itemsPageData.map((item) => (
                                    <tr key={item._id} className="transition-colors hover:bg-slate-800/50 group">
                                        <td className="p-4 pl-6 font-bold text-white">
                                            <div className="flex items-center gap-3">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-800" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                                                        <Box size={20} />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-sm">{item.name}</div>
                                                    <div className="text-xs text-slate-500">{item.brand || 'No Brand'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-slate-400">
                                            {item.barcode ? item.barcode : <span className="text-slate-600 italic">No Barcode</span>}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.itemType === 'Product' ? 'bg-indigo-500/20 text-indigo-400' :
                                                item.itemType === 'RepairPart' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-pink-500/20 text-pink-400'
                                                }`}>
                                                {item.itemType === 'Product' ? 'Device' : item.itemType === 'RepairPart' ? 'Repair Part' : 'Accessory'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-300">{item.category}</div>
                                            <div className="text-xs text-slate-500">{item.subCategory}</div>
                                        </td>
                                        <td className="p-4 text-blue-400 font-bold text-sm">€{item.price?.toFixed(2)}</td>
                                        <td className="p-4 text-slate-300 text-sm">{item.sold}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${item.stock > (item.minStock || 5) ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                item.stock > 0 ? 'bg-orange-500/30 text-orange-400 border border-orange-500/50 shadow-orange-900/20' :
                                                    'bg-red-500/30 text-red-500 border border-red-500/50 shadow-red-900/20'
                                                }`}>
                                                {item.stock} {item.stock <= (item.minStock || 5) && item.stock > 0 && '(Low)'} {item.stock === 0 && '(Out)'}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditClick(item)}
                                                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Quick Edit Quantity/Price"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {itemsPageData.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                                                <Box size={48} className="text-slate-700/50 mb-2" />
                                                <p className="text-lg font-medium">No items match your filters</p>
                                                <p className="text-sm text-slate-600">Try adjusting your search criteria or clear the filters.</p>
                                                <button onClick={() => { setSearchTerm(''); setTypeFilter('All'); setStockFilter('All'); }} className="mt-4 px-4 py-2 border border-slate-700 text-slate-300 rounded hover:bg-slate-800">Clear Filters</button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {renderPagination(itemsPage, processedItems.length, setItemsPage)}
                    </div>
                ) : activeTab === 'sales' ? (
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-sm">
                                    <th className="p-4 pl-6">Date</th>
                                    <th className="p-4">Order #</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Item Sold</th>
                                    <th className="p-4">Qty</th>
                                    <th className="p-4 pr-6 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {salesPageData.map((sale, idx) => (
                                    <tr key={`${sale.orderId}-${idx}`} className="transition-colors hover:bg-slate-800/50">
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
                                {sales.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                                                <ShoppingCart size={48} className="text-slate-700/50 mb-2" />
                                                <p className="text-lg font-medium">No recent sales found</p>
                                                <p className="text-sm text-slate-600">When sales are made, they will appear here.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {renderPagination(salesPage, sales.length, setSalesPage)}
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-sm">
                                    <th className="p-4 pl-6">Date</th>
                                    <th className="p-4">Item</th>
                                    <th className="p-4">User</th>
                                    <th className="p-4 text-center">Change</th>
                                    <th className="p-4">Reason</th>
                                    <th className="p-4 pr-6">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {historyPageData.map((log) => (
                                    <tr key={log._id} className="transition-colors hover:bg-slate-800/50">
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
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${log.reason === 'Restock' ? 'bg-green-500/20 text-green-400' :
                                                log.reason === 'Return' ? 'bg-blue-500/20 text-blue-400' :
                                                    log.reason === 'Sale' ? 'bg-purple-500/20 text-purple-400' :
                                                        'bg-slate-500/20 text-slate-400'
                                                }`}>
                                                {log.reason}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6 text-xs text-slate-400 max-w-[200px] truncate" title={log.notes}>
                                            {log.notes || '-'}
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
                                                <FileText size={48} className="text-slate-700/50 mb-2" />
                                                <p className="text-lg font-medium">No stock history found</p>
                                                <p className="text-sm text-slate-600">Stock updates will be logged here.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table >
                        {renderPagination(historyPage, history.length, setHistoryPage)}
                    </div >
                )}
            </div>

            {/* Quick Edit Modal */}
            {
                isEditModalOpen && editingItem && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                        onClick={() => setIsEditModalOpen(false)}
                    >
                        <div
                            className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 relative shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white"
                                aria-label="Close modal"
                                title="Close modal"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="text-xl font-bold text-white mb-1">Quick Edit</h3>
                            <p className="text-slate-400 text-sm mb-6">{editingItem.name}</p>

                            <form onSubmit={handleUpdateItem} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-400 block mb-1">Price (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        title="Price"
                                        placeholder="Enter price"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={editForm.price}
                                        onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-400 block mb-1">Stock Quantity</label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        title="Stock Quantity"
                                        placeholder="Enter quantity"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={editForm.stock}
                                        onChange={e => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-400 block mb-1">Reason for change</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={editForm.reason}
                                        title="Reason for change"
                                        aria-label="Reason for change"
                                        onChange={e => setEditForm({ ...editForm, reason: e.target.value })}
                                    >
                                        <option value="Manual Correction">Manual Correction (E.g. Counting Error)</option>
                                        <option value="Restock">Restock (Received new shipment)</option>
                                        <option value="Return">Return (Customer returned item)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-400 block mb-1">Notes (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="Order # or supplier info"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={editForm.notes}
                                        onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                                >
                                    <Save size={18} /> Save Changes
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Add Repair Part Modal */}
            {
                isAddPartModalOpen && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
                        onClick={() => setIsAddPartModalOpen(false)}
                    >
                        <div
                            className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 md:p-8 relative shadow-2xl my-8"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsAddPartModalOpen(false)}
                                title="Close Add Part Modal"
                                aria-label="Close modal"
                                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-2 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                                    <Box size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Add Repair Part</h3>
                                    <p className="text-slate-400 text-sm">Fill in the details for the new inventory item.</p>
                                </div>
                            </div>

                            <form onSubmit={handleAddPartSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Form Fields */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Part Name *</label>
                                    <input
                                        type="text" required placeholder="E.g. iPhone 13 Pro Screen (OLED)"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                        value={addPartForm.name} onChange={e => setAddPartForm({ ...addPartForm, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sub-Category *</label>
                                    <select
                                        required
                                        title="Sub-Category"
                                        aria-label="Sub-Category"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                                        value={addPartForm.subCategory} onChange={e => setAddPartForm({ ...addPartForm, subCategory: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Screens">Screens & Displays</option>
                                        <option value="Batteries">Batteries</option>
                                        <option value="Small Parts">Small Parts (Flex, Cameras, etc)</option>
                                        <option value="Housings">Housings & Back Glass</option>
                                        <option value="Tools">Repair Tools & Consumables</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand / Compatible With</label>
                                    <input
                                        type="text" placeholder="E.g. Apple, Samsung"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                                        value={addPartForm.brand} onChange={e => setAddPartForm({ ...addPartForm, brand: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Barcode / SKU</label>
                                    <input
                                        type="text" placeholder="Scan or type barcode"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none font-mono"
                                        value={addPartForm.barcode} onChange={e => setAddPartForm({ ...addPartForm, barcode: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier</label>
                                    <input
                                        type="text" placeholder="Supplier name"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                                        value={addPartForm.supplier} onChange={e => setAddPartForm({ ...addPartForm, supplier: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cost Price (€) *</label>
                                        <input
                                            type="number" step="0.01" min="0" required
                                            title="Cost Price" aria-label="Cost Price" placeholder="e.g. 50"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                                            value={addPartForm.cost === 0 ? '' : addPartForm.cost} onChange={e => setAddPartForm({ ...addPartForm, cost: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sale Price (€) *</label>
                                        <input
                                            type="number" step="0.01" min="0" required
                                            title="Sale Price" aria-label="Sale Price" placeholder="e.g. 100"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                                            value={addPartForm.price === 0 ? '' : addPartForm.price} onChange={e => setAddPartForm({ ...addPartForm, price: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Initial Stock *</label>
                                        <input
                                            type="number" min="0" required
                                            title="Initial Stock" aria-label="Initial Stock" placeholder="e.g. 10"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                                            value={addPartForm.stock} onChange={e => setAddPartForm({ ...addPartForm, stock: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock Alert *</label>
                                        <input
                                            type="number" min="0" required
                                            title="Low Stock Alert" aria-label="Low Stock Alert" placeholder="e.g. 5"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none border-l-4 border-l-amber-500"
                                            value={addPartForm.minStock} onChange={e => setAddPartForm({ ...addPartForm, minStock: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Image URL (Optional)</label>
                                    <input
                                        type="url" placeholder="https://..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                                        value={addPartForm.image} onChange={e => setAddPartForm({ ...addPartForm, image: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description (Optional)</label>
                                    <textarea
                                        rows={3} placeholder="Additional notes, quality details (Original, Pull, AAA), etc."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none resize-none"
                                        value={addPartForm.description} onChange={e => setAddPartForm({ ...addPartForm, description: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-2 pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddPartModalOpen(false)}
                                        className="flex-1 px-6 py-4 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-4 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                                    >
                                        <Save size={20} /> Save Repair Part
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
