import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Save, CheckSquare, Square, Search, Filter, FileSpreadsheet, Box, AlertTriangle, CheckCircle, Package, Headphones, Zap, Shield, Watch, ChevronLeft, ChevronRight, Tags, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUpload from '../components/ImageUpload';
import { api } from '../utils/api';
import useDebounce from '../hooks/useDebounce';

interface AccessoryStats {
    totalAccessories: number;
    outOfStock: number;
    lowStock: number;
    totalInventoryValue: number;
}

export default function AccessoriesManager() {
    const [accessories, setAccessories] = useState<any[]>([]);
    const [stats, setStats] = useState<AccessoryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
    
    // Pagination and Filtering State
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStockStatus, setSelectedStockStatus] = useState('');

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        category: 'audio',
        subCategory: '',
        price: '',
        stock: 0,
        minStock: 5,
        isActive: true,
        barcode: '',
        brand: '',
        model: '',
        supplierName: '',
        supplierContact: '',
        costPrice: 0,
        image: '',
        description: '',
        tag: ''
    });

    const fetchAccessories = useCallback(async () => {
        try {
            setLoading(true);
            let url = `/api/accessories?page=${page}&limit=${limit}&includeOutOfStock=true`;
            if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
            if (selectedCategory) url += `&category=${encodeURIComponent(selectedCategory)}`;
            
            const res = await api.get(url);
            if (res.data && Array.isArray(res.data.accessories)) {
                let filteredAccessories = res.data.accessories;
                
                // Client-side stock status filtering since backend doesn't explicitly filter by stock status dynamically yet
                if (selectedStockStatus === 'in_stock') {
                    filteredAccessories = filteredAccessories.filter((p: any) => p.stock > 0);
                } else if (selectedStockStatus === 'out_of_stock') {
                    filteredAccessories = filteredAccessories.filter((p: any) => p.stock === 0);
                } else if (selectedStockStatus === 'low_stock') {
                    filteredAccessories = filteredAccessories.filter((p: any) => p.stock > 0 && p.stock < (p.minStock || 5));
                }

                setAccessories(filteredAccessories);
                setTotalPages(res.data.totalPages || 1);
            } else if (Array.isArray(res.data)) {
                setAccessories(res.data);
                setTotalPages(1);
            }
        } catch (err) {
            console.error("Failed to load accessories", err);
            toast.error('Failed to load inventory.');
        } finally {
            setLoading(false);
        }
    }, [page, limit, debouncedSearch, selectedCategory, selectedStockStatus]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/api/accessories/admin/stats');
            if (res.data.success) {
                setStats(res.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats', error);
        }
    };

    useEffect(() => {
        fetchAccessories();
        fetchStats();
    }, [fetchAccessories]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this accessory?')) return;
        try {
            await api.delete(`/api/accessories/${id}`);
            toast.success('Accessory deleted successfully');
            fetchAccessories();
            fetchStats();
            setSelectedAccessories(selectedAccessories.filter(aId => aId !== id));
        } catch (error) {
            console.error("Failed to delete", error);
            toast.error('Failed to delete accessory');
        }
    };

    const handleSelectAll = () => {
        if (selectedAccessories.length === accessories.length && accessories.length > 0) {
            setSelectedAccessories([]);
        } else {
            setSelectedAccessories(accessories.map(p => p._id || p.id));
        }
    };

    const toggleSelectAccessory = (id: string) => {
        if (selectedAccessories.includes(id)) {
            setSelectedAccessories(selectedAccessories.filter(aId => aId !== id));
        } else {
            setSelectedAccessories([...selectedAccessories, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedAccessories.length} selected accessories?`)) return;
        try {
            await Promise.all(selectedAccessories.map(id => api.delete(`/api/accessories/${id}`)));
            toast.success(`Deleted ${selectedAccessories.length} accessories`);
            fetchAccessories();
            fetchStats();
            setSelectedAccessories([]);
        } catch (error) {
            console.error("Failed to perform bulk delete", error);
            toast.error('Failed to perform bulk delete');
        }
    };

    const handleEdit = (item: any) => {
        setFormData({
            id: item.id || item._id,
            name: item.name || '',
            category: item.category || 'audio',
            subCategory: item.subCategory || '',
            price: item.price || '',
            stock: item.stock ?? 0,
            minStock: item.minStock ?? 5,
            isActive: item.isActive ?? true,
            barcode: item.barcode || '',
            brand: item.brand || '',
            model: item.model || '',
            supplierName: item.supplierName || '',
            supplierContact: item.supplierContact || '',
            costPrice: item.costPrice || 0,
            image: item.image || '',
            description: item.description || '',
            tag: item.tag || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = formData.id ? `/api/accessories/${formData.id}` : '/api/accessories';
            const payload = { ...formData };

            if (formData.id) {
                await api.put(url, payload);
                toast.success('Accessory updated successfully');
            } else {
                await api.post(url, payload);
                toast.success('Accessory created successfully');
            }
            setIsModalOpen(false);
            resetForm();
            fetchAccessories();
            fetchStats();
        } catch (error) {
            console.error("Failed to save", error);
            toast.error('Failed to save accessory');
        }
    };

    const handleExportCSV = () => {
        toast.success('Preparing CSV export...');
        const headers = "ID,Name,Brand,Category,SubCategory,Price,CostPrice,Stock,Supplier,Barcode\n";
        const rows = accessories.map(p => `"${p._id || p.id}","${p.name}","${p.brand || ''}","${p.category}","${p.subCategory || ''}",${p.price},${p.costPrice || 0},${p.stock},"${p.supplierName || ''}","${p.barcode || ''}"`).join('\n');
        const csv = headers + rows;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Accessories_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsModalOpen(false);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    const resetForm = () => {
        setFormData({
            id: '', name: '', category: 'audio', subCategory: '', price: '', stock: 0, minStock: 5,
            isActive: true, barcode: '', brand: '', model: '', supplierName: '', supplierContact: '',
            costPrice: 0, image: '', description: '', tag: ''
        });
    };

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'audio': return <Headphones className="w-4 h-4" />;
            case 'power': return <Zap className="w-4 h-4" />;
            case 'protection': return <Shield className="w-4 h-4" />;
            case 'wearables': return <Watch className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
                        <div className="p-2 bg-purple-500/20 rounded-xl">
                            <Headphones className="w-7 h-7 text-purple-400" />
                        </div>
                        Accessories Inventory
                    </h1>
                    <p className="text-slate-400 mt-2">Manage premium gear, cables, cases, and add-ons.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition-all shadow-sm font-medium text-sm"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        Export CSV
                    </button>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 text-sm"
                    >
                        <Plus size={18} /> Add Accessory
                    </button>
                </div>
            </div>

            {/* Statistics */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-sm">
                        <div className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                            <Package className="w-4 h-4" /> Total Accessories
                        </div>
                        <div className="text-3xl font-bold text-white">{stats.totalAccessories}</div>
                    </div>
                    <div className="bg-emerald-500/5 backdrop-blur-md p-5 rounded-2xl border border-emerald-500/20 shadow-sm relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/20 rounded-full blur-xl"></div>
                        <div className="text-sm font-medium text-emerald-500/80 mb-1 flex items-center gap-2 relative z-10">
                            <CheckCircle className="w-4 h-4" /> Inventory Value
                        </div>
                        <div className="text-3xl font-bold text-emerald-400 relative z-10">€{stats.totalInventoryValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                    <div className="bg-orange-500/5 backdrop-blur-md p-5 rounded-2xl border border-orange-500/20 shadow-sm">
                        <div className="text-sm font-medium text-orange-500/80 mb-1 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Low Stock
                        </div>
                        <div className="text-3xl font-bold text-orange-400">{stats.lowStock}</div>
                    </div>
                    <div className="bg-red-500/5 backdrop-blur-md p-5 rounded-2xl border border-red-500/20 shadow-sm">
                        <div className="text-sm font-medium text-red-500/80 mb-1 flex items-center gap-2">
                            <X className="w-4 h-4" /> Out of Stock
                        </div>
                        <div className="text-3xl font-bold text-red-400">{stats.outOfStock}</div>
                    </div>
                </div>
            )}

            {/* Bulk Actions */}
            {selectedAccessories.length > 0 && (
                <div className="mb-6 flex items-center justify-between gap-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl animate-in fade-in slide-in-from-top-4 shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="text-purple-400 font-bold text-sm">{selectedAccessories.length}</span>
                        </div>
                        <span className="text-purple-200 font-medium">accessories selected</span>
                    </div>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-900/20"
                    >
                        <Trash2 size={16} /> Delete Selected
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name, brand, description..."
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <Filter className="w-4 h-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                list="filter-category-options"
                                className="w-40 pl-9 pr-4 py-2.5 bg-slate-950/50 border border-slate-700/80 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-all"
                                placeholder="All Categories"
                                value={selectedCategory}
                                onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                                aria-label="Filter by Category"
                            />
                            <datalist id="filter-category-options">
                                <option value="audio" />
                                <option value="power" />
                                <option value="protection" />
                                <option value="wearables" />
                                <option value="chargers" />
                                <option value="cables" />
                                <option value="cases" />
                            </datalist>
                        </div>
                        <div className="flex items-center gap-2 relative">
                            <select
                                className="pl-4 pr-8 py-2.5 bg-slate-950/50 border border-slate-700/80 rounded-xl text-white appearance-none focus:outline-none focus:border-purple-500 transition-all"
                                value={selectedStockStatus}
                                onChange={(e) => { setSelectedStockStatus(e.target.value); setPage(1); }}
                                aria-label="Filter by Stock"
                            >
                                <option value="">All Stock</option>
                                <option value="in_stock">In Stock</option>
                                <option value="low_stock">Low Stock</option>
                                <option value="out_of_stock">Out of Stock</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-slate-500 hover:text-white transition-colors"
                                        title={selectedAccessories.length === accessories.length && accessories.length > 0 ? "Deselect All" : "Select All"}
                                    >
                                        {selectedAccessories.length === accessories.length && accessories.length > 0 ? (
                                            <CheckSquare size={18} className="text-purple-500" />
                                        ) : (
                                            <Square size={18} />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-4">Item Details</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                            Loading inventory...
                                        </div>
                                    </td>
                                </tr>
                            ) : accessories.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <Box className="w-12 h-12 text-slate-700" />
                                            <p className="text-lg font-medium text-slate-400">No accessories found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                accessories.map((p: any) => {
                                    const accId = p._id || p.id;
                                    const isSelected = selectedAccessories.includes(accId);
                                    return (
                                        <tr
                                            key={accId}
                                            className={`transition-colors hover:bg-slate-800/40 ${isSelected ? 'bg-purple-500/5' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleSelectAccessory(accId)}
                                                    className="text-slate-500 hover:text-white transition-colors flex items-center"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare size={18} className="text-purple-500" />
                                                    ) : (
                                                        <Square size={18} />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-white">
                                                <div className="flex items-center gap-4">
                                                    {p.image ? (
                                                        <img
                                                            src={p.image}
                                                            alt={p.name}
                                                            className="w-14 h-14 rounded-xl object-cover bg-slate-800/50 border border-slate-700/50 p-1"
                                                        />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                                                            <Box className="w-6 h-6 text-slate-600" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-base text-slate-200">{p.name}</div>
                                                        <div className="text-xs text-slate-400 font-normal mt-1 flex items-center gap-1.5">
                                                            {p.brand && <span className="font-bold text-slate-500">{p.brand}</span>}
                                                            {p.barcode && <span className="text-slate-500 border border-slate-700 px-1 rounded">#{p.barcode}</span>}
                                                            {p.tag && <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] uppercase tracking-wide">{p.tag}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/50 text-slate-300 text-xs font-medium border border-slate-700/50 capitalize">
                                                    {getCategoryIcon(p.category)} {p.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-purple-400 font-bold text-lg">€{p.price}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${p.stock > 0 ? (p.stock < (p.minStock || 5) ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30') : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                                    {p.stock <= 0 && <X className="w-3 h-3" />}
                                                    {p.stock > 0 && p.stock < (p.minStock || 5) && <AlertTriangle className="w-3 h-3" />}
                                                    {p.stock >= (p.minStock || 5) && <CheckCircle className="w-3 h-3" />}
                                                    {p.stock} in stock
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(p)}
                                                        className="p-2 bg-slate-800 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 border border-slate-700 hover:border-purple-500/30 rounded-lg transition-colors"
                                                        title="Edit Accessory"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(accId)}
                                                        className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded-lg transition-colors"
                                                        title="Delete Accessory"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-slate-900/50">
                            <div className="text-sm text-slate-400">
                                Showing page {page} of {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    title="Previous Page"
                                    aria-label="Previous Page"
                                    className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPage(i + 1)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    title="Next Page"
                                    aria-label="Next Page"
                                    className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto relative shadow-2xl animate-in zoom-in-95"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            aria-label="Close modal"
                            className="absolute top-6 right-6 text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 border-b border-slate-800 pb-4">
                            <div className="p-2 bg-purple-500/20 rounded-xl"><Package className="w-5 h-5 text-purple-400" /></div>
                            {formData.id ? 'Edit Accessory' : 'Add New Accessory'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                
                                {/* Core Details */}
                                <div className="space-y-4">
                                    <h4 className="text-purple-400 font-bold uppercase text-xs tracking-wider border-b border-slate-800 pb-2 mb-4">Core Details</h4>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Item Name <span className="text-red-500">*</span></label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-all"
                                            placeholder="e.g. AirPods Pro 2 Silicone Case"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Category <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                list="category-options"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-all"
                                                placeholder="e.g. Audio, Cables, Cases..."
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                required
                                            />
                                            <datalist id="category-options">
                                                <option value="audio" />
                                                <option value="power" />
                                                <option value="protection" />
                                                <option value="wearables" />
                                                <option value="chargers" />
                                                <option value="cables" />
                                                <option value="cases" />
                                            </datalist>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Sub-Category</label>
                                            <input
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-all"
                                                placeholder="e.g. Case"
                                                value={formData.subCategory}
                                                onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Brand</label>
                                            <input
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-all"
                                                placeholder="e.g. Spigen"
                                                value={formData.brand}
                                                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Model</label>
                                            <input
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-all"
                                                placeholder="e.g. Tough Armor"
                                                value={formData.model}
                                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><Tags className="w-3 h-3" /> Retail Price (€) <span className="text-red-500">*</span></label>
                                            <input
                                                type="number" step="0.01"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-all"
                                                placeholder="19.99"
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Cost Price (€)</label>
                                            <input
                                                type="number" step="0.01"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-all"
                                                placeholder="5.00"
                                                value={formData.costPrice}
                                                onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Stock Qty <span className="text-red-500">*</span></label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-all"
                                                placeholder="0"
                                                value={formData.stock}
                                                onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Min Stock Alert</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-all"
                                                placeholder="5"
                                                value={formData.minStock}
                                                onChange={e => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Logistics & Image */}
                                <div className="space-y-4">
                                    <h4 className="text-emerald-400 font-bold uppercase text-xs tracking-wider border-b border-slate-800 pb-2 mb-4">Logistics & Image</h4>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Barcode / SKU</label>
                                            <input
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition-all font-mono"
                                                placeholder="Scan or type"
                                                value={formData.barcode}
                                                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Marketing Tag</label>
                                            <input
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition-all"
                                                placeholder="e.g. BESTSELLER"
                                                value={formData.tag}
                                                onChange={e => setFormData({ ...formData, tag: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Supplier Info</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <input className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-emerald-500 outline-none" placeholder="Name" value={formData.supplierName} onChange={e => setFormData({ ...formData, supplierName: e.target.value })} />
                                            </div>
                                            <input className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none" placeholder="Contact/Link" value={formData.supplierContact} onChange={e => setFormData({ ...formData, supplierContact: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-xl">
                                        <ImageUpload value={formData.image} onChange={url => setFormData({ ...formData, image: url })} label="Accessory Image" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                                <textarea
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-purple-500 outline-none h-24 resize-none transition-all"
                                    placeholder="Enter product details..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="border-t border-slate-800 pt-6">
                                <button
                                    type="submit"
                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 text-lg"
                                >
                                    <Save size={20} /> {formData.id ? 'Save Changes' : 'Create Accessory'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
